import { type IpcMainInvokeEvent, BrowserWindow } from 'electron';

import { allowWindowClose } from '../windows';

export default async (event: IpcMainInvokeEvent) => {
  const win = BrowserWindow.fromWebContents(event.sender);

  if (win) {
    allowWindowClose(win);
  }
};
