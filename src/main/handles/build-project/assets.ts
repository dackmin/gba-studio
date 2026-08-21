import { createHash } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';

import type { IpcMainInvokeEvent } from 'electron';
import { pick } from '@junipero/react';
import fse from 'fs-extra';

import type { Build } from '../../../types';
import { getBuildDir, sendLog } from './utils';

export async function getShasum (filePath: string) {
  const hash = createHash('sha256');
  const fileBuffer = await fs.readFile(filePath);
  hash.update(fileBuffer);

  return hash.digest('hex');
}

export async function isSame (source: string, destination: string) {
  try {
    const sourceShasum = await getShasum(source);
    const destinationShasum = await getShasum(destination);

    return sourceShasum === destinationShasum;
  } catch {
    return false;
  }
}

export async function copyAssets (
  event: IpcMainInvokeEvent,
  build: Build,
) {
  const projectDir = path.dirname(build.projectPath);
  const buildDir = getBuildDir(build);
  const graphicsOutputDir = path.join(buildDir, 'graphics');

  await fse.ensureDir(graphicsOutputDir);

  // Copy sprites
  for (const sprite of build.data?.sprites || []) {
    const source = path.join(projectDir, sprite.path);
    const fileName = path.basename(sprite.path, path.extname(sprite.path));
    const destination = path.join(graphicsOutputDir, fileName + '.bmp');

    if (await isSame(source, destination)) {
      sendLog(event, build.id, `Skipping ${sprite.name}, cached`);
      continue;
    }

    await fs.writeFile(
      path.join(graphicsOutputDir, fileName + '.json'),
      JSON.stringify({ type: 'sprite', ...pick(sprite, ['width', 'height']) }, null, 2),
      'utf-8'
    );

    await fse.copyFile(source, destination);
    sendLog(event, build.id, `Copied sprite: ${sprite.name} (${fileName}.json)`);
  }

  // Copy backgrounds
  for (const background of build.data?.backgrounds || []) {
    const source = path.join(projectDir, background.path);
    const fileName = path.basename(background.path, path.extname(background.path));
    const destination = path.join(graphicsOutputDir, fileName + '.bmp');

    if (await isSame(source, destination)) {
      sendLog(event, build.id, `Skipping ${background.name}, cached`);
      continue;
    }

    await fs.writeFile(
      path.join(graphicsOutputDir, fileName + '.json'),
      JSON.stringify({ type: 'regular_bg' }, null, 2),
      'utf-8'
    );

    await fse.copyFile(source, destination);
    sendLog(event, build.id, `Copied background: ${background.name} (${fileName}.json)`);
  }

  const audioOutputDir = path.join(buildDir, 'audio');
  await fse.ensureDir(audioOutputDir);

  // Copy sounds
  for (const sound of build.data?.sounds || []) {
    const source = path.join(projectDir, sound.path);
    const fileName = path.basename(sound.path, path.extname(sound.path));
    const destination = path.join(audioOutputDir, fileName + '.' + (sound.format || 'wav'));

    if (await isSame(source, destination)) {
      sendLog(event, build.id, `Skipping ${sound.name}, cached`);
      continue;
    }

    await fse.copyFile(source, destination);
    sendLog(event, build.id, `Copied sound: ${sound.name} (${fileName}.${sound.format || 'wav'})`);
  }

  // Copy music
  for (const music of build.data?.music || []) {
    const source = path.join(projectDir, music.path);
    const fileName = path.basename(music.path, path.extname(music.path));
    const destination = path.join(audioOutputDir, fileName + '.' + (music.format || 'mod'));

    if (await isSame(source, destination)) {
      sendLog(event, build.id, `Skipping ${music.name}, cached`);
      continue;
    }

    await fse.copyFile(source, destination);
    sendLog(event, build.id, `Copied music: ${music.name} (${fileName}.${music.format || 'mod'})`);
  }
}
