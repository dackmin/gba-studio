import type { IpcMainInvokeEvent } from 'electron';

import Storage from '../storage';

export default async function (
  storage: Storage,
  _: IpcMainInvokeEvent,
  data: any
) {
  await storage.addToClipboard(data);
}
