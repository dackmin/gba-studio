import type { InfiniteCanvasCursorMode } from '@junipero/react';
import type { ForwardRefExoticComponent } from 'react';

export type ProjectTemplate = '2d-sample' | 'blank';

export interface RecentProject {
  name: string;
  path: string;
}

export interface AppStorage {
  recentProjects?: RecentProject[];
}

export type VariableValue = string | number | boolean;

export type ToolType = InfiniteCanvasCursorMode | 'collisions';
export type AddSubtoolType = 'scene' | 'sensor' | 'actor';

export interface ListItem {
  name: string;
  value: string;
  icon?: ForwardRefExoticComponent<any>;
}

export interface ListCategory<T extends ListItem = ListItem> {
  name: string;
  items: T[];
}

export interface GameVariables {
  type: 'variables';
  values: Record<string, VariableValue>;
  // Internals
  id?: string;
  _file?: string;
}

export interface GameMap {
  type: 'map';
  width: number;
  height: number;
  gridSize: number;
  scene: string;
  collisions: string[];
  sensors: GameSensor[];
  // Internals
  _file?: string;
}

export interface GameScene {
  type: 'scene';
  sceneType: 'logos' | '2d-top-down';
  name: string;
  background?: string;
  map?: GameMap;
  events?: SceneEvent[];
  actors?: GameActor[];
  // Internals
  id?: string;
  _file?: string;
}

export interface GameScript {
  type: 'script';
  name: string;
  events?: SceneEvent[];
  // Internals
  id?: string;
  _file?: string;
}

export interface GameActor {
  type: 'actor';
  name: string;
  x: number;
  y: number;
  sprite: string;
  events?: {
    init?: SceneEvent[];
    interact?: SceneEvent[];
    update?: SceneEvent[];
  };
  // Internals
  id?: string;
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
  id?: string;
}

export interface ProjectSceneData {
  x: number;
  y: number;
  // Internals
  _file?: string;
}

export interface GameProject {
  name: string;
  scenes: ProjectSceneData[];
}

export interface GameSprite {
  type: string;
  // Internals
  _file?: string;
}

export interface GameBackground {
  type: string;
  // Internals
  _file?: string;
}

export interface AppPayload {
  project: GameProject;
  scenes: GameScene[];
  variables: GameVariables[];
  sprites: GameSprite[];
  backgrounds: GameBackground[];
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
  name?: string;
  // Internals
  id?: string;
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
    direction?: string;
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
}

export interface DisableActorEvent extends SceneEvent {
  type: 'disable-actor';
  actor: string;
}

export interface EnableActorEvent extends SceneEvent {
  type: 'enable-actor';
  actor: string;
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
