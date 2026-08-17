import path from 'node:path';

import { type IpcMainInvokeEvent, FileFilter, dialog } from 'electron';

export default async (_: IpcMainInvokeEvent, opts?: {
  prefix?: string;
  projectPath?: string;
  filters?: FileFilter[];
}) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: opts?.filters || [],
    defaultPath: opts?.projectPath ? path.basename(opts?.projectPath || '') : undefined,
  });

  if (!result.filePaths[0]) {
    return '';
  }

  return path.join(opts?.prefix || '', result.filePaths[0]);
};
