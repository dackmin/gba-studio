import fs from 'node:fs/promises';
import path from 'node:path';

import fse from 'fs-extra';
import slugify from 'slugify';

import type {
  GameProject,
  ProjectTemplate,
} from '../../types';
import type { HostContext } from '../../types';
import { getResourcesDir } from '../utils';
import Storage from '../storage';

export default async (storage: Storage, ctx: HostContext, opts: {
  type: ProjectTemplate;
  path: string;
  name: string;
}) => {
  const projectDir = path.resolve(opts?.path || '');

  await fs.mkdir(projectDir, { recursive: true });

  // Copy template
  await fse.copy(
    path.join(getResourcesDir(), `./public/templates/${opts.type}`),
    projectDir
  );

  // Create .gbasproj
  const project: GameProject = {
    name: opts.name || 'My Awesome Game',
    scenes: [],
    romName: 'MY AWESOME GAME',
    romCode: 'MAG',
  };

  const projectPath = path.join(projectDir, `${slugify(opts.name)}.gbasproj`);
  await fs.writeFile(projectPath,
    JSON.stringify(project, null, 2) + '\n', 'utf-8');

  storage.addToRecentProjects(projectPath, project);

  await ctx.window.openProject(projectPath);
};
