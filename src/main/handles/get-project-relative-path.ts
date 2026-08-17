import path from 'node:path';

import type { IpcMainInvokeEvent } from 'electron';

export default async function (
  _: IpcMainInvokeEvent,
  projectPath: string,
  filePath: string,
) {
  if (!projectPath || !filePath) {
    return '';
  }

  return path.relative(path.dirname(projectPath), filePath);
}
