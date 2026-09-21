import { type IpcMainInvokeEvent, BrowserWindow } from 'electron';

import type { AppPayload } from '../../types';
import { loadProjectData } from '../project';
import Storage from '../storage';

export default async (
  storage: Storage,
  event: IpcMainInvokeEvent,
  projectPath: string
): Promise<Partial<AppPayload>> => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.setProgressBar(0);

  const data = await loadProjectData(projectPath, {
    onProgress: (current, total) => {
      win?.setProgressBar(current / total);
    },
  });

  // Save project to recent projects
  storage.addToRecentProjects(projectPath, data.project!);
  win?.setProgressBar(1);

  // Reset progress
  win?.setProgressBar(-1);

  return data;
};
