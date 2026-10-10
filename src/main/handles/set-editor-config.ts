import type { AppStorage, HostContext } from '../../types';
import Storage from '../storage';

export default async (
  storage: Storage,
  _: HostContext,
  data: AppStorage
) => {
  storage.config = data;
  storage.save();
};
