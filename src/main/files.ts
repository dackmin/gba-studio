import fs from 'node:fs/promises';
import path from 'node:path';

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
