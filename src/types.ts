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
  values: Record<string, VariableValue>;
  // Internals
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
  id?: string;
  type: 'scene';
  sceneType: 'logos' | '2d-top-down';
  name: string;
  background?: string;
  map?: GameMap;
  events?: SceneEvent[];
  // Internals
  _file?: string;
}

export interface GameActor {
  name: string;
  x: number;
  y: number;
  sprite: string;
}

export interface GameSensor {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
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
  | DynamicValue;

export interface SceneEvent {
  id: string;
  type: string;
  name?: string;
  // Internals
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
}

export interface SetVariableEvent extends SceneEvent {
  type: 'set-variable';
  name: string;
  value: EventValue;
}
