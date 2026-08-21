export interface LocalData {
  collapsed: string[]
  sizes: Record<string, number>
  editor: Record<string, any>
  emulator: Record<string, any>;
};

export const load = (projectId: string): LocalData => {
  const localData = localStorage.getItem(`localData:${projectId}`);

  if (localData) {
    try {
      return JSON.parse(localData) as LocalData;
    } catch (e) {
      console.error('Failed to parse local data:', e);
    }
  }

  return {
    collapsed: [],
    sizes: {},
    emulator: {},
    editor: {},
  };
};

export const save = (projectId: string, localData: LocalData): void => {
  try {
    localStorage.setItem(`localData:${projectId}`, JSON.stringify(localData));
  } catch (e) {
    console.error('Failed to save local data:', e);
  }
};
