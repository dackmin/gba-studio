export interface SceneEvent {
  type: string;
}

export interface SceneWaitEvent extends SceneEvent {
  type: 'wait';
  duration: number;
}

export interface SceneFadeEvent extends SceneEvent {
  type: 'fade-in' | 'fade-out';
  duration: number;
}

export interface SceneButtonEvent extends SceneEvent {
  type: 'wait-for-button';
  buttons: string | string[];
  and?: boolean;
}

export interface SceneGoToEvent extends SceneEvent {
  type: 'go-to-scene';
  target: string;
}

export interface Scene {
  type: string;
  name: string;
  background?: string;
  player?: {
    x: number;
    y: number;
  };
  events: SceneEvent[];
}
