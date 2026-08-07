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
    const destination = path.join(graphicsOutputDir,
      sprite._file!.replace('.json', `.${sprite.format || 'bmp'}`));

    if (await isSame(source, destination)) {
      sendLog(event, build.id, `Skipping ${sprite.name}, cached`);
      continue;
    }

    await fs.writeFile(
      path.join(graphicsOutputDir, sprite._file!),
      JSON.stringify({ type: 'sprite', ...pick(sprite, ['width', 'height']) }, null, 2),
      'utf-8'
    );

    await fse.copyFile(source, destination);
    sendLog(event, build.id, `Copied sprite: ${sprite.name} (${sprite._file})`);
  }

  // Copy backgrounds
  for (const background of build.data?.backgrounds || []) {
    const source = path.join(projectDir, background.path);
    const destination = path.join(graphicsOutputDir,
      background._file!.replace('.json', `.${background.format || 'bmp'}`));

    if (await isSame(source, destination)) {
      sendLog(event, build.id, `Skipping ${background.name}, cached`);
      continue;
    }

    await fs.writeFile(
      path.join(graphicsOutputDir, background._file!),
      JSON.stringify({ type: 'regular_bg' }, null, 2),
      'utf-8'
    );

    await fse.copyFile(source, destination);
    sendLog(event, build.id, `Copied background: ${background.name} (${background._file})`);
  }

  const audioOutputDir = path.join(buildDir, 'audio');
  await fse.ensureDir(audioOutputDir);

  // Copy sounds
  for (const sound of build.data?.sounds || []) {
    const source = path.join(projectDir, sound.path);
    const destination = path.join(audioOutputDir,
      sound._file!.replace('.json', `.${sound.format || 'wav'}`));

    if (await isSame(source, destination)) {
      sendLog(event, build.id, `Skipping ${sound.name}, cached`);
      continue;
    }

    await fse.copyFile(source, destination);
    sendLog(event, build.id, `Copied sound: ${sound.name} (${sound._file})`);
  }

  // Copy music
  for (const music of build.data?.music || []) {
    const source = path.join(projectDir, music.path);
    const destination = path.join(audioOutputDir,
      music._file!.replace('.json', `.${music.format || 'mod'}`));

    if (await isSame(source, destination)) {
      sendLog(event, build.id, `Skipping ${music.name}, cached`);
      continue;
    }

    await fse.copyFile(source, destination);
    sendLog(event, build.id, `Copied music: ${music.name} (${music._file})`);
  }
}
