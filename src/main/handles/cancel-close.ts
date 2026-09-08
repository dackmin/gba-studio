import type { IpcMainInvokeEvent } from 'electron';

import { setQuitting } from '../windows';

export default async (_event: IpcMainInvokeEvent) => {
  // Abort a pending Cmd+Q/quit attempt so it doesn't resume once other windows close
  setQuitting(false);
};
