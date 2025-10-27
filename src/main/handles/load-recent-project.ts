import { type IpcMainInvokeEvent, BrowserWindow } from 'electron';

import { createProjectWindow } from '../windows';

export default async (event: IpcMainInvokeEvent, projectPath: string) => {
  const selectionWin = BrowserWindow.fromWebContents(event.sender);
  selectionWin?.hide();

  createProjectWindow(projectPath);

  await new Promise(resolve => setTimeout(resolve, 100));
  selectionWin?.close();
};
