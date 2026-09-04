import path from 'node:path';
import fsp from 'node:fs/promises';

import type { IpcMainInvokeEvent } from 'electron';
import { omit } from '@junipero/core';

import type { GameMusicFile } from '../../types';
import { sanitizeMusic } from '../sanitize';
import { toFileSlug } from '../../helpers';

export default async function (
  _: IpcMainInvokeEvent,
  projectPath: string,
  filePath: string,
  musicInfo: GameMusicFile,
) {
  const projectDir = path.dirname(projectPath);
  const fileExt = path.extname(filePath);
  const fileName = musicInfo._fileName
    ? path.basename(musicInfo._fileName, path.extname(musicInfo._fileName))
    : toFileSlug(musicInfo.name ?? path.basename(filePath, fileExt));

  // Copy music into project/audio
  const audioDir = path.join(projectDir, 'audio');
  await fsp.mkdir(audioDir, { recursive: true });

  await fsp.copyFile(
    filePath,
    path.join(audioDir, fileName + fileExt),
  );

  // Create content file
  const contentDir = path.join(projectDir, 'content');
  const contentFileName = 'music_' + fileName + '.json';
  await fsp.mkdir(contentDir, { recursive: true });

  musicInfo.name = musicInfo.name || fileName;
  musicInfo.path = path.relative(projectDir, path.join(audioDir, fileName + fileExt));
  musicInfo._file = contentFileName;

  try {
    await fsp.access(path.join(contentDir, contentFileName));
    Object.assign(musicInfo, omit(JSON.parse(await fsp.readFile(
      path.join(contentDir, contentFileName),
      { encoding: 'utf-8' },
    )), Object.keys(musicInfo)));
  } catch {}

  return await sanitizeMusic(musicInfo);
}
