import type { GameActor, GameScene, GameSensor, GameSprite } from '../../types';

export const DEFAULT_SCENE: GameScene = {
  id: 'preview',
  name: 'New Scene',
  background: 'bg_default',
  type: 'scene',
  sceneType: 'logos',
};

export const DEFAULT_ACTOR: GameActor = {
  id: 'preview',
  type: 'actor',
  name: 'New Actor',
  x: 0,
  y: 0,
  z: 2,
  sprite: 'sprite_default',
  width: 1,
  height: 1,
  direction: 'down',
  events: {
    init: [],
    interact: [],
    update: [],
  },
};

export const DEFAULT_SENSOR: GameSensor = {
  id: 'preview',
  type: 'sensor',
  name: 'New Sensor',
  x: 0,
  y: 0,
  width: 1,
  height: 1,
  events: [],
};

export const DEFAULT_SPRITE: GameSprite = {
  id: 'preview',
  type: 'sprite',
  name: 'New Sprite',
  x: 0,
  y: 0,
  z: 2,
  sprite: 'sprite_default',
  width: 1,
  height: 1,
};
