import { type IpcMainInvokeEvent, BrowserWindow } from 'electron';

import { createProjectWindow } from '../windows';

export default async (event: IpcMainInvokeEvent, projectPath: string) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.hide();
  win?.close();
  await new Promise(resolve => setTimeout(resolve, 100));
  createProjectWindow(projectPath);
};
