import fs from 'node:fs/promises';
import path from 'node:path';

import { type IpcMainInvokeEvent, BrowserWindow } from 'electron';
import fse from 'fs-extra';
import slugify from 'slugify';

import type {
  GameProject,
  ProjectTemplate,
} from '../../types';
import { createProjectWindow } from '../windows';
import Storage from '../storage';

export default async (storage: Storage, event: IpcMainInvokeEvent, opts: {
  type: ProjectTemplate;
  path: string;
  name: string;
}) => {
  const projectDir = path.resolve(opts?.path || '');

  await fs.mkdir(projectDir, { recursive: true });

  // Copy commons
  await fse.copy(
    path.join(__dirname, '../../public/templates/commons'),
    projectDir
  );

  // Copy template
  await fse.copy(
    path.join(__dirname, `../../public/templates/${opts.type}`),
    projectDir
  );

  // Create .gbasproj
  const project: GameProject = {
    name: opts.name || 'My Awesome Game',
    scenes: [],
  };

  const projectPath = path.join(projectDir, `${slugify(opts.name)}.gbasproj`);
  await fs.writeFile(projectPath,
    JSON.stringify(project, null, 2) + '\n', 'utf-8');

  storage.addToRecentProjects(projectPath, project);

  // Close selection window
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.hide();
  win?.close();
  await new Promise(resolve => setTimeout(resolve, 100));

  createProjectWindow(projectPath);
};
