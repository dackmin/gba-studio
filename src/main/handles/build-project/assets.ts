import { createHash } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';

import { pick } from '@junipero/react';
import fse from 'fs-extra';
import { Jimp } from 'jimp';
import { imageSizeFromFile } from 'image-size/fromFile';

import type {
  BackgroundLayout,
  Build,
  GameBackgroundFile,
  GameSpriteFile,
} from '../../../types';
import {
  countBackgroundTiles,
  countUniqueTiles,
  cropIndexedImage,
  decodeIndexedBmp,
  encodeIndexedBmp,
  getBackgroundLayoutForImage,
  toBmp,
  getBackgroundLayout,
} from '../../images';
import { BACKGROUND_VRAM_TILES_BUDGET } from '../../../commons';
import { getBuildDir } from './utils';

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

export async function getBackgroundLayoutFromFile (
  build: Build,
  background: GameBackgroundFile,
): Promise<BackgroundLayout> {
  const source = path.join(path.dirname(build.projectPath), background.path);
  const fileName = path.basename(background.path, path.extname(background.path));
  const { width, height } = await imageSizeFromFile(source);
  const layout = getBackgroundLayout(fileName, width, height);

  return layout.mode === 'single'
    ? layout
    : getBackgroundLayoutForImage(fileName, decodeIndexedBmp(await fs.readFile(source)));
}

async function cutBackground (
  build: Build,
  background: GameBackgroundFile,
  layout: BackgroundLayout,
  graphicsOutputDir: string,
) {
  const source = path.join(path.dirname(build.projectPath), background.path);
  const image = decodeIndexedBmp(await fs.readFile(source));
  const fileName = path.basename(background.path, path.extname(background.path));
  const expected = new Set<string>();
  const jsonContent = JSON.stringify({ type: 'regular_bg' }, null, 2);
  let written = 0;

  for (const tile of layout.tiles) {
    const cropped = cropIndexedImage(image, tile.x, tile.y, tile.width, tile.height);

    if (countUniqueTiles(cropped.indices, cropped.width, cropped.height, { limit: 1024 }) > 1024) {
      build.events.onError(
        `Background ${background.name} is too detailed: it has more than 1024 different ` +
        `8x8px tiles in the ${tile.width}x${tile.height}px area at ${tile.x},${tile.y}. ` +
        `Game may build but it will crash or not display correctly. ` +
        'Simplify the image (repeated patterns, flat colors, less dithering) or make it smaller.'
      );
    }

    const bmp = encodeIndexedBmp(cropped);
    const bmpPath = path.join(graphicsOutputDir, tile.name + '.bmp');
    const jsonPath = path.join(graphicsOutputDir, tile.name + '.json');

    expected.add(tile.name + '.bmp').add(tile.name + '.json');

    const current = await fs.readFile(bmpPath).catch(() => null);

    if (!current?.equals(bmp)) {
      await fs.writeFile(bmpPath, bmp);
      written++;
    }

    const currentJson = await fs.readFile(jsonPath, 'utf-8').catch(() => null);

    if (currentJson !== jsonContent) {
      await fs.writeFile(jsonPath, jsonContent, 'utf-8');
    }
  }

  await removeStaleBackgroundFiles(graphicsOutputDir, fileName, expected);

  if (written === 0) {
    build.events.onLog(`Skipping ${background.name}, cached`);
  } else {
    build.events.onLog(
      layout.mode === 'tiles'
        ? `Cut background: ${background.name} into ${layout.tiles.length} tiles (${fileName})`
        : `Prepared background: ${background.name} (${fileName})`
    );

    const { loaded } = countBackgroundTiles(image, layout);

    if (layout.mode === 'tiles' && loaded > BACKGROUND_VRAM_TILES_BUDGET) {
      build.events.onLog(
        `Warning: ${background.name} needs up to ${loaded} tiles in memory at once, ` +
        `the limit is about ${BACKGROUND_VRAM_TILES_BUDGET}. Some parts of it won't be ` +
        'displayed. Reduce its detail (repeated patterns, fewer unique 8x8 tiles) or its size.'
      );
    }
  }
}

async function removeStaleBackgroundFiles (
  graphicsOutputDir: string,
  fileName: string,
  expected: Set<string>,
) {
  const pattern = new RegExp(`^${fileName}(_tile_\\d+_\\d+)?\\.(bmp|json)$`);

  for (const file of await fs.readdir(graphicsOutputDir)) {
    if (pattern.test(file) && !expected.has(file)) {
      await fs.rm(path.join(graphicsOutputDir, file), { force: true });
    }
  }
}

export async function copyAssets (
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
      build.events.onLog(`Skipping ${sprite.name}, cached`);
      continue;
    }

    await fs.writeFile(
      path.join(graphicsOutputDir, fileName + '.json'),
      JSON.stringify({ type: 'sprite', ...pick(sprite, ['width', 'height']) }, null, 2),
      'utf-8'
    );

    await fse.copyFile(source, destination);

    // if (sprite.transparentColor) {
    //   const transparencyColorIsSame = await checkTransparencyColor(destination, sprite);

    //   if (!transparencyColorIsSame) {
    //     sendLog(event, build.id,
    //       `Transparency color mismatch for sprite: ${sprite.name}, recreated`);
    //   }
    // }

    build.events.onLog(`Copied sprite: ${sprite.name} (${fileName}.json)`);
  }

  // Copy backgrounds
  for (const background of build.data?.backgrounds || []) {
    const source = path.join(projectDir, background.path);
    const fileName = path.basename(background.path, path.extname(background.path));
    const destination = path.join(graphicsOutputDir, fileName + '.bmp');
    const layout = await getBackgroundLayoutFromFile(build, background);

    background._layout = layout;
    const [tile] = layout.tiles;

    if (
      layout.tiles.length > 1 ||
      tile.width !== layout.width ||
      tile.height !== layout.height
    ) {
      await cutBackground(build, background, layout, graphicsOutputDir);
      continue;
    }

    await removeStaleBackgroundFiles(
      graphicsOutputDir, fileName, new Set([fileName + '.bmp', fileName + '.json']));

    if (await isSame(source, destination)) {
      build.events.onLog(`Skipping ${background.name}, cached`);
      continue;
    }

    await fs.writeFile(
      path.join(graphicsOutputDir, fileName + '.json'),
      JSON.stringify({ type: 'regular_bg' }, null, 2),
      'utf-8'
    );

    await fse.copyFile(source, destination);
    build.events.onLog(`Copied background: ${background.name} (${fileName}.json)`);
  }

  // Copy fonts
  for (const font of build.data?.fonts || []) {
    const source = path.join(projectDir, font.path);
    const fileName = path.basename(font.path, path.extname(font.path));
    const destination = path.join(graphicsOutputDir, fileName + '.bmp');

    if (await isSame(source, destination)) {
      build.events.onLog(`Skipping ${font.name}, cached`);
      continue;
    }

    await fs.writeFile(
      path.join(graphicsOutputDir, fileName + '.json'),
      JSON.stringify({
        type: 'sprite',
        width: Math.max(8, Math.round(font.width ?? 8)),
        height: Math.max(8, Math.round(font.height ?? 8)),
      }, null, 2),
      'utf-8'
    );

    await fse.copyFile(source, destination);
    build.events.onLog(`Copied font: ${font.name} (${fileName}.json)`);
  }

  const audioOutputDir = path.join(buildDir, 'audio');
  await fse.ensureDir(audioOutputDir);

  // Copy sounds
  for (const sound of build.data?.sounds || []) {
    const source = path.join(projectDir, sound.path);
    const fileName = path.basename(sound.path, path.extname(sound.path));
    const destination = path.join(audioOutputDir, fileName + '.' + (sound.format || 'wav'));

    if (await isSame(source, destination)) {
      build.events.onLog(`Skipping ${sound.name}, cached`);
      continue;
    }

    await fse.copyFile(source, destination);
    build.events.onLog(`Copied sound: ${sound.name} (${fileName}.${sound.format || 'wav'})`);
  }

  // Copy music
  for (const music of build.data?.music || []) {
    const source = path.join(projectDir, music.path);
    const fileName = path.basename(music.path, path.extname(music.path));
    const destination = path.join(audioOutputDir, fileName + '.' + (music.format || 'mod'));

    if (await isSame(source, destination)) {
      build.events.onLog(`Skipping ${music.name}, cached`);
      continue;
    }

    await fse.copyFile(source, destination);
    build.events.onLog(`Copied music: ${music.name} (${fileName}.${music.format || 'mod'})`);
  }
}

export async function checkTransparencyColor (
  destination: string,
  sprite: GameSpriteFile
) {
  // Get source first palette color
  // Palette starts at 54 (fileHeader 14 + infoHeader 40)
  // 1bit per channel (rgb = 3) -> ends at 57
  const destinationImage = await Jimp.read(destination);
  const destinationTransparencyColor = '#' + destinationImage.bitmap.data
    .subarray(54, 57).toString('hex');

  if (sprite.transparentColor !== destinationTransparencyColor) {
    // @ts-expect-error - jimp is weird
    const { buffer } = await toBmp(destinationImage, {
      transparentColor: sprite.transparentColor,
    });

    await fs.writeFile(destination, buffer, 'utf-8');

    return false;
  }

  return true;
}
