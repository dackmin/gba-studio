import { createContext } from 'react';

import type {
  GameActor,
  GameBackground,
  GameProject,
  GameScene,
  GameSensor,
  GameSprite,
  GameVariables,
  ToolType,
} from '../../types';

export interface AppContextType {
  scenes: GameScene[];
  project?: GameProject;
  variables: GameVariables[];
  sprites: GameSprite[];
  backgrounds: GameBackground[];
  projectPath: string;
  projectBase: string;
  dirty: boolean;
};

export const AppContext = createContext<AppContextType>({
  scenes: [],
  variables: [],
  sprites: [],
  backgrounds: [],
  projectPath: '',
  projectBase: '',
  dirty: false,
});

export interface CanvasContextType {
  selectedScene?: GameScene;
  selectedItem?: GameActor | GameSensor;
  tool: ToolType;
};

export const CanvasContext = createContext<CanvasContextType>({
  tool: 'move',
});
