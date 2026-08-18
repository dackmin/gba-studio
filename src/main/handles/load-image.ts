import path from 'node:path';
import fsp from 'node:fs/promises';

import type { IpcMainInvokeEvent } from 'electron';
import { HorizontalAlign, Jimp, ResizeStrategy, VerticalAlign, type Bitmap } from 'jimp';

import type { SpriteBitmap } from '../../types';
import { toBmp } from '../images';

type BmpDecoder = Bitmap & {
  palette?: any[];
  compression: number;
};

// A single sprite frame is at least 8x8, so sprite sheets (grids of frames)
// only need each dimension padded up to a multiple of 8 to stay valid.
function roundUpToTile (value: number, tileSize: number = 8): number {
  return Math.ceil(value / tileSize) * tileSize;
}

export default async function (
  _: IpcMainInvokeEvent,
  projectPath: string,
  filePath: string,
) {
  const projectDir = path.dirname(projectPath);
  let image = await Jimp.read(filePath);
  const originalMime = image.mime;
  const originalWidth = image.bitmap.width;
  const originalHeight = image.bitmap.height;
  let resized = false;

  // Butano sprite size chart
  // https://gvaliente.github.io/butano/classbn_1_1sprite__shape__size.html
  //
  // | ------------ | ----- | ------ | ----- | ----- |
  // | shape / size | small | normal | big   | huge  |
  // | ------------ | ----- | ------ | ----- | ----- |
  // | square       | 8x8   | 16x16  | 32x32 | 64x64 |
  // | wide         | 16x8  | 32x8   | 32x16 | 64x32 |
  // | tall         | 8x16  | 8x32   | 16x32 | 32x64 |
  // | ------------ | ----- | ------ | ----- | ----- |
  let targetWidth = roundUpToTile(image.bitmap.width);
  let targetHeight = roundUpToTile(image.bitmap.height);

  // The smallest dimension is a single frame's cross axis, so it can't exceed the biggest sprite.
  if (targetWidth < targetHeight) {
    targetWidth = Math.min(targetWidth, 64);
  } else if (targetWidth > targetHeight) {
    targetHeight = Math.min(targetHeight, 64);
  } else {
    // Square, limit both dimensions
    targetWidth = Math.min(targetWidth, 64);
    targetHeight = Math.min(targetHeight, 64);
  }

  if (targetWidth !== image.bitmap.width || targetHeight !== image.bitmap.height) {
    resized = true;
    image.contain({
      w: targetWidth,
      h: targetHeight,
      // Pad on the bottom/right only, so existing frames keep their grid alignment.
      align: HorizontalAlign.LEFT | VerticalAlign.TOP,
      mode: ResizeStrategy.NEAREST_NEIGHBOR,
    });
  }

  let bitmap = image.bitmap as BmpDecoder;

  // We have to force rewrite the bitmap if it's not a BMP or if it has no palette or is compressed
  if (
    image.mime !== 'image/bmp' ||
    (bitmap.palette?.length || 0) <= 0 ||
    bitmap.compression !== 0
  ) {
    // @ts-expect-error jimp is weird
    image = await Jimp.fromBuffer(await toBmp(image));

    bitmap = image.bitmap as BmpDecoder;
  }

  // Write data to a temp file
  const tempImportPath = path.join(projectDir, '.gbastudio/tmp/import');
  await fsp.mkdir(tempImportPath, { recursive: true });
  image.write(`${tempImportPath}/sprite-temp.bmp`); // jimp types are WEIRD

  return {
    width: bitmap.width,
    height: bitmap.height,
    originalWidth,
    originalHeight,
    data: await image.getBase64('image/bmp'),
    mime: originalMime,
    isIndexed: (bitmap.palette?.length || 0) > 0,
    isCompressed: bitmap.compression !== 0,
    isResized: resized,
  } satisfies SpriteBitmap;
}
