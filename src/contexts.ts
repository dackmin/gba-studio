import { createContext } from 'react';

import type { GameScene } from './types';

export interface AppContextType {
  scenes: GameScene[];
  projectPath: string;
  projectBase: string;
};

export const AppContext = createContext<AppContextType>({
  scenes: [],
  projectPath: '',
  projectBase: '',
});
