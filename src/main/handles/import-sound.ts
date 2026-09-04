import path from 'node:path';
import fsp from 'node:fs/promises';

import type { IpcMainInvokeEvent } from 'electron';
import { omit } from '@junipero/core';

import type { GameSoundFile } from '../../types';
import { sanitizeSound } from '../sanitize';
import { toFileSlug } from '../../helpers';

export default async function (
  _: IpcMainInvokeEvent,
  projectPath: string,
  filePath: string,
  soundInfo: GameSoundFile,
) {
  const projectDir = path.dirname(projectPath);
  const fileExt = path.extname(filePath);
  const fileName = soundInfo._fileName
    ? path.basename(soundInfo._fileName, path.extname(soundInfo._fileName))
    : toFileSlug(soundInfo.name ?? path.basename(filePath, fileExt));

  // Copy sound into project/sounds
  const soundsDir = path.join(projectDir, 'audio');
  await fsp.mkdir(soundsDir, { recursive: true });

  await fsp.copyFile(
    filePath,
    path.join(soundsDir, fileName + fileExt),
  );

  // Retrieve content file
  const contentDir = path.join(projectDir, 'content');
  const contentFileName = 'sound_' + fileName + '.json';
  await fsp.mkdir(contentDir, { recursive: true });

  soundInfo.name = soundInfo.name || fileName;
  soundInfo.path = path.relative(projectDir, path.join(soundsDir, fileName + fileExt));
  soundInfo._file = contentFileName;

  try {
    await fsp.access(path.join(contentDir, contentFileName));
    Object.assign(soundInfo, omit(JSON.parse(await fsp.readFile(
      path.join(contentDir, contentFileName),
      { encoding: 'utf-8' },
    )), Object.keys(soundInfo)));
  } catch {}

  return await sanitizeSound(soundInfo);
}
