import path from 'node:path';
import fs from 'node:fs/promises';

import { type IpcMainInvokeEvent, dialog, BrowserWindow } from 'electron';

import { createProjectWindow } from '../windows';

export default async (event: IpcMainInvokeEvent) => {
  const paths = await dialog.showOpenDialog({
    properties: ['openDirectory', 'openFile'],
  });

  if (!paths.filePaths[0]) {
    return;
  }

  const selectionWin = BrowserWindow.fromWebContents(event.sender);
  selectionWin?.hide();

  const stats = await fs.stat(paths.filePaths[0]);

  if (stats.isDirectory()) {
    const projectFile = await fs
      .readdir(paths.filePaths[0])
      .then(files => files.find(file => file.endsWith('.gbasproj')));

    if (projectFile) {
      createProjectWindow(path.join(paths.filePaths[0], projectFile));
    }
  } else if (stats.isFile() && paths.filePaths[0].endsWith('.gbasproj')) {
    createProjectWindow(paths.filePaths[0]);
  }

  await new Promise(resolve => setTimeout(resolve, 100));
  selectionWin?.close();
};
