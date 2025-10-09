import { createContext } from 'react';

import type {
  GameActor,
  GameBackground,
  GameProject,
  GameScene,
  GameScript,
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
  sounds: string[];
  scripts: GameScript[];
  projectPath: string;
  projectBase: string;
  dirty: boolean;
};

export const AppContext = createContext<AppContextType>({
  scenes: [],
  variables: [],
  sprites: [],
  backgrounds: [],
  sounds: [],
  scripts: [],
  projectPath: '',
  projectBase: '',
  dirty: false,
});

export interface CanvasContextType {
  selectedScene?: GameScene;
  selectedItem?: GameActor | GameSensor | GameScript;
  tool: ToolType;
};

export const CanvasContext = createContext<CanvasContextType>({
  tool: 'default',
});

export interface SceneFormContextType {
  scene?: GameScene;
}

export const SceneFormContext = createContext<SceneFormContextType>({
  scene: undefined,
});
