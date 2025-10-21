import path from 'node:path';

import type { IpcMainInvokeEvent } from 'electron';

export default function (_: IpcMainInvokeEvent, projectPath: string) {
  return path.join(
    path.dirname(projectPath),
    path.basename(path.dirname(projectPath)) + '.gba'
  );
}
