import path from 'node:path';

import type { IpcMainInvokeEvent } from 'electron';

export default function (_: IpcMainInvokeEvent, projectPath: string) {
  const romPath = path.join(
    'out',
    path.basename(projectPath, path.extname(projectPath)) + '.gba'
  );

  if (process.platform === 'win32') {
    return romPath.replace(/\\/g, '/');
  }

  return romPath;
}
