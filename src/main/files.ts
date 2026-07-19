import fs from 'node:fs/promises';
import path from 'node:path';

import { Jimp } from 'jimp';

export const getDataFiles = async (
  base: string,
  cond: (file: string) => boolean = () => true
) => {
  try {
    return (await fs
      .readdir(path.join(base, 'content')))
      .filter(file => cond(file));
  } catch {
    return [];
  }
};

export const getSceneFiles = async (
  base: string,
) => {
  return getDataFiles(
    base,
    file =>
      file.startsWith('scene_') &&
      file.endsWith('.json') &&
      !file.endsWith('.map.json') &&
      file !== 'scene_default.json'
  );
};

export const getGraphicsFiles = async (
  base: string,
  cond: (file: string) => boolean = () => true
) => {
  try {
    return (await fs
      .readdir(path.join(base, 'graphics')))
      .filter(file => cond(file));
  } catch {
    return [];
  }
};

export const getSoundFiles = async (
  base: string,
  cond: (file: string) => boolean = () => true
) => {
  try {
    return (await fs
      .readdir(path.join(base, 'audio')))
      .filter(file => cond(file));
  } catch {
    return [];
  }
};

export const getScriptsFiles = async (
  base: string,
) => {
  return getDataFiles(
    base,
    file =>
      file.startsWith('script_') &&
      file.endsWith('.json')
  );
};

export const getAnimationsFiles = async (
  base: string,
) => {
  return getDataFiles(
    base,
    file =>
      file.endsWith('.animations.json')
  );
};

export const getVariableFiles = async (
  base: string,
) => {
  return getDataFiles(
    base,
    file =>
      file.startsWith('variables') &&
      file.endsWith('.json') &&
      file !== 'variables_default.json'
  );
};

export const getGraphicFileSize = async (
  base: string,
  allowedExtensions: string[] = ['bmp'],
) => {
  // let file: Buffer<ArrayBuffer> | undefined;
  const filePath = base.replace('.json', '');

  for (const ext of allowedExtensions) {
    try {
      await fs.access(filePath + '.' + ext);
    } catch {
      continue;
    }

    const image = await Jimp.read(filePath + '.' + ext);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    return { width, height };
  }

  return { width: undefined, height: undefined };
};
