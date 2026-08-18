import path from 'node:path';
import fsp from 'node:fs/promises';

import type { IpcMainInvokeEvent } from 'electron';
import slugify from 'slugify';

import { GameSpriteFile } from '../../types';
import { sanitizeSprite } from '../sanitize';

export default async function (
  _: IpcMainInvokeEvent,
  projectPath: string,
  filePath: string,
  spriteInfo: GameSpriteFile,
) {
  const projectDir = path.dirname(projectPath);
  const fileExt = path.extname(filePath);
  const fileName = slugify(path.basename(filePath, fileExt), {
    lower: true,
    strict: true,
    replacement: '_',
  });

  // Copy sprite into project/graphics
  const graphicsDir = path.join(projectDir, 'graphics');
  await fsp.mkdir(graphicsDir, { recursive: true });

  try {
    await fsp.access(path.join(projectDir, '.gbastudio/tmp/import/sprite-temp.bmp'));
    await fsp.copyFile(
      path.join(projectDir, '.gbastudio/tmp/import/sprite-temp.bmp'),
      path.join(graphicsDir, fileName + fileExt),
    );
    await fsp.rm(path.join(projectDir, '.gbastudio/tmp/import/sprite-temp.bmp'));
  } catch {
    await fsp.copyFile(
      filePath,
      path.join(graphicsDir, fileName + fileExt),
    );
  }

  // Create content file
  const contentDir = path.join(projectDir, 'content');
  const contentFileName = 'sprite_' + fileName + '.json';
  await fsp.mkdir(contentDir, { recursive: true });

  try {
    await fsp.access(path.join(contentDir, contentFileName));
    Object.assign(spriteInfo, JSON.parse(await fsp.readFile(
      path.join(contentDir, contentFileName),
      { encoding: 'utf-8' },
    )));
  } catch {}

  spriteInfo.name = fileName;
  spriteInfo.path = path.relative(projectDir, path.join(graphicsDir, fileName + fileExt));
  spriteInfo._file = contentFileName;

  return await sanitizeSprite(spriteInfo);
}
