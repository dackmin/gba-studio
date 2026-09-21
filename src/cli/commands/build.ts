/* eslint-disable no-console */

import { randomUUID } from 'node:crypto';
import fsp from 'node:fs/promises';
import path from 'node:path';

import type { Build } from '../../types';
import { loadProjectData } from '../../main/project';
import { checkDependencies } from '../../main/vendors';
import { buildProject } from '../../main/handles/build-project';

export const findProjectPath = async () => {
  const folderContent = await fsp.readdir(process.cwd());

  for (const item of folderContent) {
    if (item.endsWith('.gbasproj')) {
      return path.join(process.cwd(), item);
    }
  }

  throw new Error('No .gbasproj file found in the current directory');
};

export default async function build (
  opts?: {
    configurationName?: string;
  }
) {
  const controller = new AbortController();
  const projectPath = await findProjectPath();

  const currentBuild: Build = {
    id: randomUUID(),
    configurationName: opts?.configurationName,
    projectPath,
    controller,
    data: await loadProjectData(projectPath),
    events: {
      onLog: console.log,
      onStep: () => {},
      onError: console.error,
      onSuccess: console.log,
      onAbort: () => process.exit(1),
      onStart: () => {},
      onComplete: () => {},
    },
  };

  try {
    await checkDependencies(currentBuild);

    if (currentBuild.controller?.signal.aborted) {
      return;
    }

    await buildProject(currentBuild);
  } catch (e) {
    if (currentBuild.controller?.signal.aborted) {
      currentBuild.events.onAbort();
    } else {
      currentBuild.events.onError((e as Error).message);
      currentBuild.events.onAbort();
    }
  }
}
