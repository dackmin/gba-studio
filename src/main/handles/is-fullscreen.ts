import { type IpcMainInvokeEvent, BrowserWindow } from 'electron';

export default async (event: IpcMainInvokeEvent) => {
  const win = BrowserWindow.fromWebContents(event.sender);

  return win?.isFullScreen() || false;
};
