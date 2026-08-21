import path from 'node:path';
import fsp from 'node:fs/promises';

import type { IpcMainInvokeEvent } from 'electron';
import { omit } from '@junipero/core';

import type { GameSpriteFile } from '../../types';
import { sanitizeSprite } from '../sanitize';
import { toFileSlug } from '../../helpers';

export default async function (
  _: IpcMainInvokeEvent,
  projectPath: string,
  filePath: string,
  spriteInfo: GameSpriteFile,
) {
  const projectDir = path.dirname(projectPath);
  const fileExt = path.extname(filePath);
  const fileName = toFileSlug(spriteInfo.name ?? path.basename(filePath, fileExt));

  // Copy sprite into project/graphics
  const graphicsDir = path.join(projectDir, 'graphics');
  await fsp.mkdir(graphicsDir, { recursive: true });

  try {
    await fsp.access(path.join(projectDir, '.gbastudio/tmp/import/temp.bmp'));
    await fsp.copyFile(
      path.join(projectDir, '.gbastudio/tmp/import/temp.bmp'),
      path.join(graphicsDir, fileName + '.bmp'),
    );
    await fsp.rm(path.join(projectDir, '.gbastudio/tmp/import/temp.bmp'));
  } catch {
    await fsp.copyFile(
      filePath,
      path.join(graphicsDir, fileName + '.bmp'),
    );
  }

  // Create content file
  const contentDir = path.join(projectDir, 'content');
  const contentFileName = 'sprite_' + fileName + '.json';
  await fsp.mkdir(contentDir, { recursive: true });

  spriteInfo.name = spriteInfo.name || fileName;
  spriteInfo.path = path.relative(projectDir, path.join(graphicsDir, fileName + '.bmp'));
  spriteInfo._file = contentFileName;

  try {
    await fsp.access(path.join(contentDir, contentFileName));
    Object.assign(spriteInfo, omit(JSON.parse(await fsp.readFile(
      path.join(contentDir, contentFileName),
      { encoding: 'utf-8' },
    )), Object.keys(spriteInfo)));
  } catch {}

  return await sanitizeSprite(spriteInfo);
}
