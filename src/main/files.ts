import fs from 'node:fs/promises';
import path from 'node:path';

import { Jimp } from 'jimp';

import type { GameScene, GameScript } from '../types';
import { toFileSlug } from '../helpers';

export type ContentFileKind = 'scene' | 'script';

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

export const renameContentFile = async (
  kind: ContentFileKind,
  projectPath: string,
  currentFileName: string,
  data?: Partial<GameScene | GameScript>,
): Promise<string | null> => {
  // Lazy import: the CLI bundles this module outside of Electron
  const { dialog } = await import('electron');
  const contentDir = path.join(path.dirname(projectPath), 'content');
  await fs.mkdir(contentDir, { recursive: true });

  const defaultFileName = currentFileName?.endsWith('.json')
    ? currentFileName
    : `${currentFileName || `${kind}_1`}.json`;

  const result = await dialog.showSaveDialog({
    title: `Rename ${kind === 'scene' ? 'Scene' : 'Script'} File`,
    defaultPath: path.join(contentDir, defaultFileName),
    filters: [{ name: `JSON ${kind} file`, extensions: ['json'] }],
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  const rawBaseName = path.basename(result.filePath, '.json');
  const slug = toFileSlug(rawBaseName.replace(new RegExp(`^${kind}_`), ''));
  const newFileName = `${kind}_${slug}.json`;

  const oldFilePath = path.join(contentDir, currentFileName);
  const newFilePath = path.join(contentDir, newFileName);

  if (oldFilePath !== newFilePath) {
    try {
      await fs.access(oldFilePath);
      await fs.rename(oldFilePath, newFilePath);
    } catch {
      if (data) {
        const dataToSave = { ...data };
        delete dataToSave._file;
        await fs.writeFile(
          newFilePath,
          JSON.stringify(dataToSave, null, 2) + '\n',
          'utf-8',
        );
      }
    }
  }

  return newFileName;
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
