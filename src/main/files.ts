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
  return getDataFiles(
    base,
    file =>
      (file.startsWith('sprite_') || file.startsWith('background_')) &&
      file.endsWith('.json') &&
      (!cond || cond(file))
  );
};

export const getAudioFiles = async (
  base: string,
  cond: (file: string) => boolean = () => true
) => {
  return getDataFiles(
    base,
    file =>
      (file.startsWith('sound_') || file.startsWith('music_')) &&
      file.endsWith('.json') &&
      (!cond || cond(file))
  );
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
  filePath: string,
) => {
  try {
    const image = await Jimp.read(filePath);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    return { width, height };
  } catch {
    return { width: undefined, height: undefined };
  }
};
