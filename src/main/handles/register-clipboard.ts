import type { HostContext } from '../../types';
import Storage from '../storage';

export default async function (
  storage: Storage,
  _: HostContext,
  data: any
) {
  await storage.addToClipboard(data);
}
