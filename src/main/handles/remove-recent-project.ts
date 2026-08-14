import type { IpcMainInvokeEvent } from 'electron';

import Storage from '../storage';

export default async (storage: Storage, _event: IpcMainInvokeEvent, projectPath: string) => {
  storage.removeRecentProject(projectPath);
};
