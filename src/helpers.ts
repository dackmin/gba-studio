import { exists } from '@junipero/core';
import slugify from 'slugify';

import type { GameBackgroundFile, GameMusicFile, GameSoundFile, GameSpriteFile } from './types';

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
