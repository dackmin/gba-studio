import path from 'node:path';

import { type IpcMainInvokeEvent, dialog } from 'electron';

export default async (_: IpcMainInvokeEvent, opts?: {
  prefix?: string;
  suffix?: string;
}) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  return path.join(opts?.prefix || '', result.filePaths[0], opts?.suffix || '');
};
