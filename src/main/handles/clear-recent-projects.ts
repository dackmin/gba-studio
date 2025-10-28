import Storage from '../storage';

export default async (storage: Storage) => {
  storage.clearRecentProjects();
};
