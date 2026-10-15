import fs from 'node:fs/promises';

import type { IpcMainInvokeEvent } from 'electron';

import type { AppPayload, AutoSavePayload } from '../../types';
import { getAutosavePath } from '../files';
import { sanitize } from '../sanitize';

export default async (
  _: IpcMainInvokeEvent,
  projectPath: string,
  data: Partial<AppPayload>
) => {
  const autosavePath = getAutosavePath(projectPath);

  const payload: AutoSavePayload = {
    $autosave: true,
    version: 1,
    savedAt: Date.now(),
    projectPath,
    data: await sanitize(data, { projectPath }),
  };

  await fs.writeFile(autosavePath,
    JSON.stringify(payload, null, 2) + '\n', 'utf-8');
};
