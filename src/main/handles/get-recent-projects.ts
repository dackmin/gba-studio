import Storage from '../storage';

export default async (storage: Storage) => {
  const { recentProjects } = storage.config;

  return recentProjects || [];
};
