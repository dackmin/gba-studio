import { createContext } from 'react';

import type {
  AppPayload,
  GameActor,
  GameProject,
  GameScene,
  GameScript,
  GameSensor,
  ToolType,
} from '../../types';

export interface AppContextType extends Omit<AppPayload, 'project'> {
  project?: GameProject;
  projectPath: string;
  projectBase: string;
  dirty: boolean;
};

export const AppContext = createContext<AppContextType>({
  scenes: [],
  variables: [],
  sprites: [],
  backgrounds: [],
  music: [],
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
