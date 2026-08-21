import fs from 'node:fs/promises';
import path from 'node:path';

import type { IpcMainInvokeEvent } from 'electron';

import type {
  AppPayload,
  GameBackgroundFile,
  GameMusicFile,
  GameScene,
  GameScript,
  GameSoundFile,
  GameSpriteFile,
  GameVariables,
} from '../../types';
import { getAudioFiles, getGraphicsFiles, getSceneFiles, getScriptsFiles } from '../files';
import { serialize } from '../serialize';
import { sanitize } from '../sanitize';

export const saveItem = async (
  item:
    | GameVariables
    | GameScene
    | GameScript
    | GameSpriteFile
    | GameBackgroundFile
    | GameMusicFile
    | GameSoundFile,
  projectDir: string
) => {
  if (item._file) {
    const fileName = item._file;
    delete item._file;

    await fs.writeFile(path.join(projectDir, 'content', fileName),
      JSON.stringify(item, null, 2) + '\n', 'utf-8');
  }
};

export const cleanObsoleteItems = async (
  projectDir: string,
  existingFiles: string[],
  newItems?: (
    | GameVariables
    | GameScene
    | GameScript
    | GameSpriteFile
    | GameBackgroundFile
    | GameMusicFile
    | GameSoundFile
  )[],
) => {
  for (const file of existingFiles) {
    if (!newItems?.some(i => i._file === file)) {
      await fs.unlink(path.join(projectDir, 'content', file));
    }
  }
};

export default async (
  _: IpcMainInvokeEvent,
  projectPath: string,
  data: Partial<AppPayload>
) => {
  const projectDir = path.dirname(projectPath);
  data = await serialize(await sanitize(data, { projectPath }));

  // Save variables
  for (const variableSet of data.variables || []) {
    await saveItem(variableSet, projectDir);
  }

  // Delete obsolete scenes
  await cleanObsoleteItems(
    projectDir,
    await getSceneFiles(projectDir),
    data.scenes
  );

  // Save scenes
  for (const scene of data.scenes || []) {
    await saveItem(scene, projectDir);
  }

  // Delete obsolete scripts
  await cleanObsoleteItems(
    projectDir,
    await getScriptsFiles(projectDir),
    data.scripts
  );

  // Save scripts
  for (const script of data.scripts || []) {
    await saveItem(script, projectDir);
  }

  // Delete obsolete backgrounds
  await cleanObsoleteItems(
    projectDir,
    await getGraphicsFiles(projectDir, f => f.startsWith('background_')),
    data.backgrounds
  );

  // Save backgrounds
  for (const background of data.backgrounds || []) {
    await saveItem(background, projectDir);
  }

  // Delete obsolete sprites
  await cleanObsoleteItems(
    projectDir,
    await getGraphicsFiles(projectDir, f => f.startsWith('sprite_')),
    data.sprites
  );

  // Save sprites
  for (const sprite of data.sprites || []) {
    await saveItem(sprite, projectDir);
  }

  // Delete obsolete sounds
  await cleanObsoleteItems(
    projectDir,
    await getAudioFiles(projectDir, f => f.startsWith('sound_')),
    data.sounds
  );

  // Save sounds
  for (const sound of data.sounds || []) {
    await saveItem(sound, projectDir);
  }

  // Delete obsolete music
  await cleanObsoleteItems(
    projectDir,
    await getAudioFiles(projectDir, f => f.startsWith('music_')),
    data.music
  );

  // Save music
  for (const music of data.music || []) {
    await saveItem(music, projectDir);
  }

  // Save project config
  await fs.writeFile(projectPath,
    JSON.stringify(data.project || {}, null, 2) + '\n', 'utf-8');
};
