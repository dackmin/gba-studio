import type { InfiniteCanvasCursorMode } from '@junipero/react';
import type { FC, ForwardRefExoticComponent } from 'react';

export type ProjectTemplate = '2d-sample' | 'blank';

export interface ViewDefinition {
  name?: string;
  title?: string;
  icon?: FC;
  view: FC;
  provider?: FC;
  leftSidebar?: FC;
  rightSidebar?: FC;
  bottomBar?: FC;
}

export interface RecentProject {
  name: string;
  path: string;
}

export interface AppStorage {
  recentProjects?: RecentProject[];
  buildConfiguration?: string;
  clipboard?: any;
}

export type VariableValue = string | number | boolean;

export type ToolType = InfiniteCanvasCursorMode | 'collisions';
export type AddSubToolType = 'scene' | 'sensor' | 'actor' | 'sprite';
export type SubToolType = AddSubToolType;

export type CharacterDirection = 'up' | 'down' | 'left' | 'right';

export type Direction = 'up' | 'down' | 'left' | 'right' |
  'up_left' | 'up_right' | 'down_left' | 'down_right';

export interface ListItem {
  name: string;
  value: string;
  icon?: ForwardRefExoticComponent<any>;
}

export interface ListCategory<T extends ListItem = ListItem> {
  name: string;
  items: T[];
}

export interface GameVariable {
  type: 'variable';
  name: string;
  defaultValue: EventValue;
  // Internals
  id: string;
}

export interface GameVariables {
  type: 'variables';
  values: GameVariable[];
  // Internals
  id: string;
  _file?: string;
}

export interface GameMap {
  type: 'map';
  width: number;
  height: number;
  gridSize: number;
  scene?: string;
  collisions?: string[][];
  sensors?: GameSensor[];
}

export interface GamePlayer {
  type: 'player';
  x: number;
  y: number;
  z?: number;
  width?: number;
  height?: number;
  direction?: CharacterDirection;
  sprite?: string;
}

export interface GameScene {
  type: 'scene';
  sceneType: 'logos' | '2d-top-down';
  name: string;
  background?: string;
  player?: GamePlayer;
  map?: GameMap;
  events?: SceneEvent[];
  actors?: GameActor[];
  sprites?: GameSprite[];
  // Internals
  id: string;
  _file?: string;
}

export interface GameScript {
  type: 'script';
  name: string;
  events?: SceneEvent[];
  // Internals
  id: string;
  _file?: string;
}

export interface GameActor {
  type: 'actor';
  name: string;
  x: number;
  y: number;
  z?: number;
  direction?: CharacterDirection;
  width?: number;
  height?: number;
  sprite: string;
  events?: {
    init?: SceneEvent[];
    interact?: SceneEvent[];
    update?: SceneEvent[];
  };
  // Internals
  id: string;
}

export interface GameSprite {
  type: 'sprite';
  name: string;
  width?: number;
  height?: number;
  x: number;
  y: number;
  z?: number;
  sprite: string;
  // Internals
  id: string;
}

export interface GameSensor {
  type: 'sensor';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  events?: SceneEvent[];
  // Internals
  id: string;
}

export interface ProjectSceneData {
  x: number;
  y: number;
  // Internals
  id?: string;
  _file?: string;
}

export interface ProjectSettings {
  pythonPath?: string;
  emulatorType?: 'internal' | 'external';
  emulatorCommand?: string;
}

export interface ProjectConfiguration {
  id: string;
  name?: string;
  settings?: ProjectSettings;
}

export interface GameProject {
  name: string;
  romName: string;
  romCode: string;
  scenes: ProjectSceneData[];
  settings?: ProjectSettings;
  configurations?: ProjectConfiguration[];
  startingScene?: string;
}

export interface GameSpriteFile {
  type: string;
  width?: number;
  height?: number;
  // Internals
  _file?: string;
}

export interface GameBackgroundFile {
  type: string;
  // Internals
  _file?: string;
}

export declare interface AppPayload {
  project: GameProject;
  scenes: GameScene[];
  variables: GameVariables[];
  sprites: GameSpriteFile[];
  backgrounds: GameBackgroundFile[];
  music: string[];
  sounds: string[];
  scripts: GameScript[];
};

export interface DynamicVariableValue {
  type: 'variable';
  name?: string;
}

export type DynamicValue =
  | DynamicVariableValue;

export type EventValue =
  | string
  | number
  | boolean
  | DynamicValue;

export interface SceneEvent {
  type: string;
  enabled?: boolean;
  name?: string;
  // Internals
  id: string;
  _name?: string;
  _collapsed?: boolean;
}

export interface WaitEvent extends SceneEvent {
  type: 'wait';
  duration: EventValue;
}

export interface FadeInEvent extends SceneEvent {
  type: 'fade-in';
  duration: EventValue;
}

export interface FadeOutEvent extends SceneEvent {
  type: 'fade-out';
  duration: EventValue;
}

export interface GoToSceneEvent extends SceneEvent {
  type: 'go-to-scene';
  target: string;
  start?: {
    x?: EventValue;
    y?: EventValue;
    direction?: Direction;
  };
}

export interface PlayMusicEvent extends SceneEvent {
  type: 'play-music';
  name: string;
  volume?: number;
  loop?: boolean;
}

export interface StopMusicEvent extends SceneEvent {
  type: 'stop-music';
}

export interface PlaySoundEvent extends SceneEvent {
  type: 'play-sound';
  name: string;
  volume?: number;
  speed?: number;
  pan?: number;
  priority?: number;
}

export interface WaitForButtonEvent extends SceneEvent {
  type: 'wait-for-button';
  buttons: string[];
  every?: boolean;
}

export interface OnButtonPressEvent extends SceneEvent {
  type: 'on-button-press';
  buttons: string[];
  events?: SceneEvent[];
}

export interface SetVariableEvent extends SceneEvent {
  type: 'set-variable';
  name: string;
  value: EventValue;
}

export interface ShowDialogEvent extends SceneEvent {
  type: 'show-dialog';
  text: string;
  direction?: Direction;
  z?: number;
}

export interface DisableActorEvent extends SceneEvent {
  type: 'disable-actor';
  actor: string;
}

export interface EnableActorEvent extends SceneEvent {
  type: 'enable-actor';
  actor: string;
}

export interface MoveCameraToEvent extends SceneEvent {
  type: 'move-camera-to';
  x: EventValue;
  y: EventValue;
  duration?: EventValue;
  allowDiagonal?: boolean;
  directionPriority?: 'horizontal' | 'vertical';
}

export interface GameMenuChoice {
  text: string;
  events: SceneEvent[];
  // Internals
  id: string;
}

export interface ShowMenuEvent extends SceneEvent {
  type: 'show-menu';
  choices: GameMenuChoice[];
  direction?: Direction;
  z?: number;
}

export interface IfEventCondition {
  type: 'condition';
  left: EventValue | IfEventCondition;
  operator: 'eq' | 'neq' | '&&' | '||';
  right: EventValue | IfEventCondition;
}

export interface IfEvent extends SceneEvent {
  type: 'if';
  conditions: IfEventCondition[];
  then?: SceneEvent[];
  else?: SceneEvent[];
}

export interface ExecuteScriptEvent extends SceneEvent {
  type: 'execute-script';
  script: string;
}

export type AnimationType = 'idle' | 'walk';

export type FramesDefinition = {
  [key in AnimationType]: {
    [key in CharacterDirection]: number | number[];
  };
};

export interface BuildOptions {
  clean?: boolean;
}

export interface Build {
  id: string;
  projectPath: string;
  controller?: AbortController;
  data?: Partial<AppPayload>;
  opts?: BuildOptions;
}

export interface BuildMessage {
  id: string;
  type?: 'log' | 'error' | 'success';
  message: string;
}
