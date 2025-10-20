import type { MoveableState } from '@junipero/react';
import { createContext } from 'react';

import type {
  AppPayload,
  GameActor,
  GameProject,
  GameScene,
  GameScript,
  GameSensor,
  GameVariables,
  ToolType,
} from '../../types';

export interface AppContextType extends Omit<AppPayload, 'project'> {
  project?: GameProject;
  projectPath: string;
  projectBase: string;
  dirty: boolean;
  building: boolean;
  setBuilding(building: boolean): void;
  onMoveScene?(scene: GameScene, e: Partial<MoveableState>): void;
  onCanvasChange?(payload: Partial<AppPayload>): void;
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
  building: false,
  setBuilding: () => {},
});

export interface EditorContextType {
  view: string;
  leftSidebarOpened: boolean;
  setView(view: string): void;
  toggleLeftSidebar(): void;
}

export const EditorContext = createContext<EditorContextType>({
  view: '',
  leftSidebarOpened: true,
  setView: () => {},
  toggleLeftSidebar: () => {},
});

export interface CanvasContextType {
  selectedScene?: GameScene;
  selectedItem?: GameActor | GameSensor | GameScript;
  tool: ToolType;
  setTool?(tool: ToolType): void;
  resetTool?(): void;
  selectItem?(
    scene?: GameScene,
    item?: GameActor | GameSensor
  ): void;
  resetSelection?(): void;
  selectScene?(scene?: GameScene): void;
  selectScript?(script?: GameScript): void;
  onVariablesChange?(registry: GameVariables): void;
  onScriptsChange?(scripts: GameScript[]): void;
  onScriptChange?(script?: GameScript): void;
  onSceneChange?(scene?: GameScene): void;
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
