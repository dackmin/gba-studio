import { type IpcMainInvokeEvent, FileFilter, dialog } from 'electron';

export default async (_: IpcMainInvokeEvent, opts?: {
  defaultPath?: string;
  filters?: FileFilter[];
}) => {
  const result = await dialog.showSaveDialog({
    defaultPath: opts?.defaultPath,
    filters: opts?.filters || [],
  });

  return result.canceled ? '' : result.filePath;
};
