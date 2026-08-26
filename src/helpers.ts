import { cloneDeep, exists, omit } from '@junipero/core';
import { v4 as uuid } from 'uuid';
import slugify from 'slugify';

import type {
  GameActor,
  GameBackgroundFile,
  GameMusicFile,
  GameScene,
  GameSensor,
  GameSoundFile,
  GameSprite,
  GameSpriteFile,
} from './types';

export const tileToPixel = (tile: number, gridSize: number) =>
  tile * gridSize;

export const pixelToTile = (pixel: number, gridSize: number) =>
  Math.floor(pixel / gridSize);

export const getSceneName = (filePath?: string) => {
  if (!filePath) {
    return 'unknown';
  }

  return filePath.replace('.json', '');
};

export const getGraphicName = (filePath?: string) => {
  if (!filePath) {
    return 'unknown';
  }

  return filePath.replace(/\.(bmp|json)$/, '');
};

export const getSoundName = (filePath?: string) => {
  if (!filePath) {
    return 'unknown';
  }

  return filePath.replace(/\.(wav|mod|json)$/, '');
};

export const loadImage = async (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.crossOrigin = 'anonymous';

    img.onload = () => {
      resolve(img);
    };

    img.onerror = reject;

    img.src = src;
  });
};

export const getImageSize = async (src: string): Promise<[number, number]> => {
  const img = await loadImage(src);

  return [img.width, img.height];
};

export const getTilesCount = (
  width?: number,
  height?: number,
  gridWidth?: number,
  gridHeight?: number,
): number => {
  width = width || 0;
  height = height || 0;

  if (!exists(gridWidth)) {
    gridWidth = width > height ? width : height;
  }

  if (!exists(gridHeight)) {
    gridHeight = width > height ? width : height;
  }

  return Math.max(Math.ceil(width / gridWidth!),
    Math.ceil(height / gridHeight!));
};

export const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const toFileSlug = (name: string) => slugify(name, {
  lower: true,
  strict: true,
  replacement: '_',
});

export const findScene = (
  scenes: GameScene[] = [],
  id?: string,
): GameScene | undefined => {
  return scenes.find(s => s.id === id || s.name === id || s._file === id);
};

export const findSprite = (
  sprites: GameSpriteFile[] = [],
  id?: string,
): GameSpriteFile | undefined => {
  return sprites.find(s => s.id === id || s.name === id || s._file === id);
};

export const findBackground = (
  backgrounds: GameBackgroundFile[] = [],
  id?: string,
): GameBackgroundFile | undefined => {
  return backgrounds.find(b => b.id === id || b.name === id || b._file === id);
};

export const findSound = (
  sounds: GameSoundFile[] = [],
  id?: string,
): GameSoundFile | undefined => {
  return sounds.find(s => s.id === id || s.name === id || s._file === id);
};

export const findMusic = (
  music: GameMusicFile[] = [],
  id?: string,
): GameMusicFile | undefined => {
  return music.find(m => m.id === id || m.name === id || m._file === id);
};

export const duplicateActor = (scene: GameScene, actor: GameActor): GameActor => {
  const sceneActor = (scene.actors || []).find(a => a.id === actor.id);
  const isSamePosition = sceneActor?.x === actor.x && sceneActor?.y === actor.y;

  const newActor: GameActor = {
    ...cloneDeep(omit(actor, ['id'])),
    id: uuid(),
    name: `${actor.name} copy`,
    x: sceneActor
      ? Math.min((actor.x || 0) + (isSamePosition ? 1 : 0), (scene.map?.width || 0) - 1)
      : 0,
    y: sceneActor
      ? Math.min((actor.y || 0) + (isSamePosition ? 1 : 0), (scene.map?.height || 0) - 1)
      : 0,
  };

  return newActor;
};

export const duplicateSprite = (scene: GameScene, sprite: GameSprite): GameSprite => {
  const sceneSprite = (scene.sprites || []).find(s => s.id === sprite.id);
  const isSamePosition = sceneSprite?.x === sprite.x && sceneSprite?.y === sprite.y;

  const newSprite: GameSprite = {
    ...cloneDeep(omit(sprite, ['id'])),
    id: uuid(),
    name: `${sprite.name} copy`,
    x: sceneSprite
      ? Math.min((sprite.x || 0) + (isSamePosition ? 1 : 0), (scene.map?.width || 0) - 1)
      : 0,
    y: sceneSprite
      ? Math.min((sprite.y || 0) + (isSamePosition ? 1 : 0), (scene.map?.height || 0) - 1)
      : 0,
  };

  return newSprite;
};

export const duplicateSensor = (scene: GameScene, sensor: GameSensor): GameSensor => {
  const sceneSensor = (scene.map?.sensors || []).find(s => s.id === sensor.id);
  const isSamePosition = sceneSensor?.x === sensor.x && sceneSensor?.y === sensor.y;

  const newSensor: GameSensor = {
    ...cloneDeep(omit(sensor, ['id'])),
    id: uuid(),
    name: `${sensor.name} copy`,
    x: sceneSensor
      ? Math.min((sensor.x || 0) + (isSamePosition ? 1 : 0), (scene.map?.width || 0) - 1)
      : 0,
    y: sceneSensor
      ? Math.min((sensor.y || 0) + (isSamePosition ? 1 : 0), (scene.map?.height || 0) - 1)
      : 0,
  };

  return newSensor;
};
