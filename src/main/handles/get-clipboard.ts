import type { IpcMainInvokeEvent } from 'electron';

import Storage from '../storage';

export default async function (storage: Storage, _: IpcMainInvokeEvent) {
  return storage.config.clipboard;
}
