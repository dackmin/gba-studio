import type { HostContext } from '../../types';
import Storage from '../storage';

export default async function (storage: Storage, _: HostContext) {
  return storage.config.clipboard;
}
