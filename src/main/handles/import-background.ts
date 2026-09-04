import path from 'node:path';
import fsp from 'node:fs/promises';

import type { IpcMainInvokeEvent } from 'electron';
import { omit } from '@junipero/core';
import { Jimp } from 'jimp';

import type { GameBackgroundFile } from '../../types';
import { sanitizeBackground } from '../sanitize';
import { toFileSlug } from '../../helpers';
import { resizeToFit, toBmp } from '../images';

export default async function (
  _: IpcMainInvokeEvent,
  projectPath: string,
  filePath: string,
  backgroundInfo: GameBackgroundFile,
) {
  const projectDir = path.dirname(projectPath);
  const fileExt = path.extname(filePath);
  const fileName = toFileSlug(path.basename(filePath, fileExt));

  // Copy background into project/graphics
  const graphicsDir = path.join(projectDir, 'graphics');
  await fsp.mkdir(graphicsDir, { recursive: true });

  const image = await Jimp.read(filePath);
  // @ts-expect-error - jimp is weird
  resizeToFit(image, 'background');

  // @ts-expect-error - jimp is weird
  const { buffer: bmpBuffer } = await toBmp(image);

  await fsp.writeFile(path.join(graphicsDir, fileName + '.bmp'), bmpBuffer);

  // Create content file
  const contentDir = path.join(projectDir, 'content');
  const contentFileName = 'background_' + fileName + '.json';
  await fsp.mkdir(contentDir, { recursive: true });

  backgroundInfo.name = backgroundInfo.name || fileName;
  backgroundInfo.path = path.relative(projectDir, path.join(graphicsDir, fileName + '.bmp'));
  backgroundInfo._file = contentFileName;

  try {
    await fsp.access(path.join(contentDir, contentFileName));
    Object.assign(backgroundInfo, omit(JSON.parse(await fsp.readFile(
      path.join(contentDir, contentFileName),
      { encoding: 'utf-8' },
    )), Object.keys(backgroundInfo)));
  } catch {}

  return await sanitizeBackground(backgroundInfo);
}
