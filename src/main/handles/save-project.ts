import fs from 'node:fs/promises';
import path from 'node:path';

import type { IpcMainInvokeEvent } from 'electron';

import type { AppPayload } from '../../types';
import { getSceneFiles, getScriptsFiles } from '../files';
import { serializeScene } from '../serialize';

export default async (
  _: IpcMainInvokeEvent,
  projectPath: string,
  data: AppPayload
) => {
  const projectDir = path.dirname(projectPath);

  // Save variables
  for (const variableSet of data.variables || []) {
    if (variableSet._file) {
      const fileName = variableSet._file;
      delete variableSet._file;

      await fs.writeFile(path.join(projectDir, 'content', fileName),
        JSON.stringify(variableSet, null, 2) + '\n', 'utf-8');
    }
  }

  // Delete obsolete scenes
  const existingSceneFiles: string[] = ([] as string[])
    .concat(await getSceneFiles(projectDir));

  const newSceneFiles = (data.scenes || []).map(s =>
    s._file
  ).filter(f => f) as string[];

  for (const file of existingSceneFiles) {
    if (!newSceneFiles.includes(file)) {
      await fs.unlink(path.join(projectDir, 'content', file));
    }
  }

  // Save scenes
  for (const scene of data.scenes || []) {
    if (scene._file) {
      const fileName = scene._file;
      delete scene._file;

      await fs.writeFile(path.join(projectDir, 'content', fileName),
        JSON.stringify(serializeScene(scene), null, 2) + '\n', 'utf-8');
    }
  }

  // Delete obsolete scripts
  const existingScriptFiles: string[] = await getScriptsFiles(projectDir);
  const newScriptFiles = (data.scripts || []).map(s => s._file).filter(f => f);

  for (const file of existingScriptFiles) {
    if (!newScriptFiles.includes(file)) {
      await fs.unlink(path.join(projectDir, 'content', file));
    }
  }

  // Save scripts
  for (const script of data.scripts || []) {
    if (script._file) {
      const fileName = script._file;
      delete script._file;

      await fs.writeFile(path.join(projectDir, 'content', fileName),
        JSON.stringify(script, null, 2) + '\n', 'utf-8');
    }
  }

  // Save project config
  await fs.writeFile(projectPath,
    JSON.stringify(data.project || {}, null, 2) + '\n', 'utf-8');
};
