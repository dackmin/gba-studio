import fs from 'node:fs/promises';

import type { IpcMainInvokeEvent } from 'electron';

import { getAutosavePath } from '../files';

export default async (
  _: IpcMainInvokeEvent,
  projectPath: string,
) => {
  try {
    await fs.unlink(getAutosavePath(projectPath));
  } catch {}
};
