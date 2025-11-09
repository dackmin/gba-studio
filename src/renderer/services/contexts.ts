import type { MoveableState } from '@junipero/react';
import { createContext } from 'react';

import type {
  AppPayload,
  AppStorage,
  GameActor,
  GamePlayer,
  GameProject,
  GameScene,
  GameScript,
  GameSensor,
  GameVariables,
  SubToolType,
  ToolType,
} from '../../types';

export interface AppContextType extends Omit<AppPayload, 'project'> {
  project?: GameProject;
  projectPath: string;
  projectBase: string;
  resourcesPath: string;
  dirty: boolean;
  building: boolean;
  editorConfig?: AppStorage;
  clipboard?: any;
  save(): Promise<void>;
  setBuilding(building: boolean): void;
  setEditorConfig(config: AppStorage): void;
  setClipboard(data: any): void;
  onMoveScene?(scene: GameScene, e: Partial<MoveableState>): void;
  onCanvasChange?(payload: Partial<AppPayload>): void;
  onProjectChange?(project: GameProject): void;
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
  resourcesPath: '',
  dirty: false,
  building: false,
  save: async () => {},
  setBuilding: () => {},
  setEditorConfig: () => {},
  setClipboard: () => {},
});

export interface EditorContextType {
  view: string;
  leftSidebarOpened: boolean;
  leftSidebarWidth: number;
  rightSidebarOpened: boolean;
  rightSidebarWidth: number;
  bottomBarOpened: boolean;
  bottomBarHeight: number;
  tileX?: number;
  tileY?: number;
  setView(view: string): void;
  toggleLeftSidebar(): void;
  setLeftSidebarWidth(width: number): void;
  toggleRightSidebar(): void;
  setRightSidebarWidth(width: number): void;
  toggleBottomBar(): void;
  setBottomBarHeight(height: number): void;
  setTilePosition(x?: number, y?: number): void;
}

export const EditorContext = createContext<EditorContextType>({
  view: '',
  leftSidebarOpened: true,
  leftSidebarWidth: 300,
  rightSidebarOpened: true,
  rightSidebarWidth: 300,
  bottomBarOpened: true,
  bottomBarHeight: 300,
  setView: () => {},
  toggleLeftSidebar: () => {},
  setLeftSidebarWidth: _ => {},
  setRightSidebarWidth: _ => {},
  toggleRightSidebar: () => {},
  setBottomBarHeight: _ => {},
  toggleBottomBar: () => {},
  setTilePosition: () => {},
});

export interface CanvasContextType {
  selectedScene?: GameScene;
  selectedItem?: GameActor | GameSensor | GameScript | GamePlayer;
  tool: ToolType;
  subTool?: SubToolType;
  setTool?(tool: ToolType, subTool?: SubToolType): void;
  resetTool?(): void;
  selectItem?(
    scene?: GameScene,
    item?: GameActor | GameSensor | GamePlayer
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

export interface BottomBarContextType {
  manualScroll: boolean;
  scrolledToBottom: boolean;
  scrollToBottom(): void;
  isScrolledToBottom(): boolean;
}

export const BottomBarContext = createContext<BottomBarContextType>({
  manualScroll: false,
  scrolledToBottom: true,
  scrollToBottom: () => {},
  isScrolledToBottom: () => true,
});
