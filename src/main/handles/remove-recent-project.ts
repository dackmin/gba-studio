import type { HostContext } from '../../types';
import Storage from '../storage';

export default async (storage: Storage, _ctx: HostContext, projectPath: string) => {
  storage.removeRecentProject(projectPath);
};
