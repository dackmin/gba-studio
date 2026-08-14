import fsp from 'node:fs/promises';

import { type IpcMainInvokeEvent, BrowserWindow, dialog } from 'electron';

import { createProjectWindow } from '../windows';

export default async (event: IpcMainInvokeEvent, projectPath: string) => {
  try {
    await fsp.access(projectPath);

    const selectionWin = BrowserWindow.fromWebContents(event.sender);
    selectionWin?.hide();

    createProjectWindow(projectPath);

    await new Promise(resolve => setTimeout(resolve, 100));
    selectionWin?.close();
  } catch {
    dialog.showErrorBox(
      'Project Not Found',
      `The project at "${projectPath}" could not be found.`
    );
  }
};
