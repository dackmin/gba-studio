export interface RecentProject {
  name: string;
  path: string;
}

export interface AppStorage {
  recentProjects?: RecentProject[];
}

export type VariableValue = string | number | boolean;

export type ToolType = 'move' | 'add' | 'collisions' | 'pan';
export type AddSubtoolType = 'sensor' | 'actor';

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
  type: 'scene';
  sceneType: 'logos' | '2d-top-down';
  name: string;
  background?: string;
  map?: GameMap;
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
};

export interface SceneEvent {
  id: string;
  type: string;
}

export interface WaitEvent extends SceneEvent {
  type: 'wait';
  duration: number; // in ms
}

export interface FadeInEvent extends SceneEvent {
  type: 'fade-in';
  duration: number; // in ms
}

export interface FadeOutEvent extends SceneEvent {
  type: 'fade-out';
  duration: number; // in ms
}
