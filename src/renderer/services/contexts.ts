import type { MoveableState } from '@junipero/react';
import { createContext } from 'react';

import type {
  AppPayload,
  AppStorage,
  LogMessage,
  CharacterDirection,
  GameActor,
  GamePlayer,
  GameProject,
  GameScene,
  GameScript,
  GameSensor,
  GameSprite,
  GameSpriteFile,
  GameVariable,
  GameVariables,
  SpriteAnimation,
  SpriteAnimationFrame,
  SpriteAnimationState,
  SubToolType,
  ToolType,
  GameBackgroundFile,
} from '../../types';
import type EventEmitter from './emitter';
import { LocalData } from './local-db';

export interface AppContextType extends Omit<AppPayload, 'project'> {
  eventEmitter?: EventEmitter;
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
  selectedItem?: GameActor | GameSensor | GameScript | GamePlayer | GameSprite |
    GameVariable;
  tool: ToolType;
  subTool?: SubToolType;
  setTool?(tool: ToolType, subTool?: SubToolType): void;
  resetTool?(): void;
  selectItem?(
    scene?: GameScene,
    item?: GameActor | GameSensor | GamePlayer | GameScript | GameSprite
  ): void;
  resetSelection?(): void;
  selectScene?(scene?: GameScene): void;
  selectScript?(script?: GameScript): void;
  selectVariable?(variable?: GameVariable): void;
  onVariablesChange?(registry: GameVariables): void;
  onScriptsChange?(scripts: GameScript[]): void;
  onScriptChange?(script?: GameScript): void;
  onVariableChange?(variable?: GameVariable): void;
  onScenesChange?(scenes: GameScene[]): void;
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

export interface BottomBarTabsContextType {
  manualScroll: boolean;
  scrolledToBottom: boolean;
  scrollToBottom(): void;
  isScrolledToBottom(): boolean;
}

export const BottomBarTabsContext = createContext<BottomBarTabsContextType>({
  manualScroll: false,
  scrolledToBottom: true,
  scrollToBottom: () => {},
  isScrolledToBottom: () => true,
});

export interface LogsContextType {
  buildLogs: LogMessage[];
  emulatorLogs: LogMessage[];
  clearBuildLogs(): void;
  addEmulatorLog(log: LogMessage): void;
  clearEmulatorLogs(): void;
}

export const LogsContext = createContext<LogsContextType>({
  buildLogs: [],
  emulatorLogs: [],
  clearBuildLogs: () => {},
  addEmulatorLog: () => {},
  clearEmulatorLogs: () => {},
});

export interface SpriteContextType {
  selectedSprite?: GameSpriteFile;
  selectedBackground?: GameBackgroundFile;
  selectedAnimation?: SpriteAnimation;
  selectedState?: SpriteAnimationState;
  selectedFrame?: SpriteAnimationFrame;
  selectedStateName?: Exclude<keyof SpriteAnimation['states'], 'fixed'>;
  selectedDirection?: CharacterDirection;
  selectSprite?(spriteFile?: GameSpriteFile): void;
  selectBackground?(backgroundFile?: GameBackgroundFile): void;
  selectAnimation?(animation?: SpriteAnimation): void;
  selectState?(state?: SpriteAnimationState): void;
  selectFrame?(frame?: SpriteAnimationFrame): void;
  selectStateName?(
    stateName: Exclude<keyof SpriteAnimation['states'], 'fixed'>
  ): void;
  selectDirection?(direction: CharacterDirection): void;
  onAnimationsChange?(sprite: GameSpriteFile): void;
  onAddAnimation?(): void;
  onRemoveAnimation?(animation: SpriteAnimation): void;
}

export const SpriteContext = createContext<SpriteContextType>({
  selectedSprite: undefined,
  selectedAnimation: undefined,
  selectSprite: () => {},
  selectAnimation: () => {},
  onAnimationsChange: () => {},
  onAddAnimation: () => {},
  onRemoveAnimation: () => {},
});

export interface PlaybackContextType {
  playing: boolean;
  index: number;
  play(): void;
  pause(): void;
  stop(): void;
  jumpToStart(): void;
  jumpToEnd(): void;
  jumpTo(index: number): void;
}

export const PlaybackContext = createContext<PlaybackContextType>({
  playing: false,
  index: 0,
  play: () => {},
  pause: () => {},
  stop: () => {},
  jumpToStart: () => {},
  jumpToEnd: () => {},
  jumpTo: () => {},
});

export interface EmulatorContextType {
  volume: number;
  setVolume(volume: number): void;
}

export const EmulatorContext = createContext<EmulatorContextType>({
  volume: 1,
  setVolume: () => {},
});

export interface LocalDataContextType extends LocalData {
  collapse(key: string): void;
  isCollapsed(key: string): boolean;
}

export const LocalDataContext = createContext<LocalDataContextType>({
  collapsed: [],
  collapse: () => {},
  isCollapsed: () => false,
});

export interface ModalContextType {
  close(): void;
}

export const ModalContext = createContext<ModalContextType>({
  close: () => {},
});
