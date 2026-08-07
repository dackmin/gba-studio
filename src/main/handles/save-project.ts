import fs from 'node:fs/promises';
import path from 'node:path';

import type { IpcMainInvokeEvent } from 'electron';

import type {
  AppPayload,
  GameBackgroundFile,
  GameScene,
  GameScript,
  GameSpriteFile,
  GameVariables,
} from '../../types';
import { getSceneFiles, getScriptsFiles } from '../files';
import { serialize } from '../serialize';
import { sanitize } from '../sanitize';

export const saveItem = async (
  item:
    | GameVariables
    | GameScene
    | GameScript
    | GameSpriteFile
    | GameBackgroundFile,
  projectDir: string
) => {
  if (item._file) {
    const fileName = item._file;
    delete item._file;

    await fs.writeFile(path.join(projectDir, 'content', fileName),
      JSON.stringify(item, null, 2) + '\n', 'utf-8');
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
  const existingSceneFiles: string[] = ([] as string[])
    .concat(await getSceneFiles(projectDir));

  const newSceneFiles = (data.scenes || []).map(s =>
    s._file
  ).filter(f => f) as string[];

  for (const file of existingSceneFiles) {
    if (!newSceneFiles.includes(file)) {
      await fs.unlink(path.join(projectDir, 'content', file));
    }
  }

  // Save scenes
  for (const scene of data.scenes || []) {
    await saveItem(scene, projectDir);
  }

  // Delete obsolete scripts
  const existingScriptFiles: string[] = await getScriptsFiles(projectDir);
  const newScriptFiles = (data.scripts || []).map(s => s._file).filter(f => f);

  for (const file of existingScriptFiles) {
    if (!newScriptFiles.includes(file)) {
      await fs.unlink(path.join(projectDir, 'content', file));
    }
  }

  // Save scripts
  for (const script of data.scripts || []) {
    await saveItem(script, projectDir);
  }

  // Save graphics
  for (const background of data.backgrounds || []) {
    await saveItem(background, projectDir);
  }

  // Save sprites
  for (const sprite of data.sprites || []) {
    await saveItem(sprite, projectDir);
  }

  // Save project config
  await fs.writeFile(projectPath,
    JSON.stringify(data.project || {}, null, 2) + '\n', 'utf-8');
};
