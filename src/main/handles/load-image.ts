import type { IpcMainInvokeEvent } from 'electron';
import { Jimp } from 'jimp';

import type { SpriteBitmap } from '../../types';
import { toBmp, resizeToFit } from '../images';

export default async function (
  _: IpcMainInvokeEvent,
  filePath: string,
  mode: 'sprite' | 'background' | 'font' = 'sprite',
  opts?: {
    transparencyColor?: string;
  }
): Promise<SpriteBitmap> {
  const image = await Jimp.read(filePath);
  const originalMime = image.mime;
  const originalWidth = image.bitmap.width;
  const originalHeight = image.bitmap.height;

  // @ts-expect-error - jimp is weird
  const { resized } = resizeToFit(image, mode);

  // Backgrounds can't be customized by users (no transparency color picker), so artwork pixels
  // matching the reserved palette color must never be keyed out: only actually transparent
  // pixels (transparent PNG holes and resize padding) are.
  const bmpOptions = mode === 'background'
    ? { matchTransparent: false }
    : { transparentColor: opts?.transparencyColor };

  // @ts-expect-error - jimp is weird
  const { buffer: bmpBuffer, tiles, transparentColor } = await toBmp(image, bmpOptions);

  return {
    width: image.bitmap.width,
    height: image.bitmap.height,
    mime: originalMime,
    originalWidth,
    originalHeight,
    data: `data:image/bmp;base64,${bmpBuffer.toString('base64')}`,
    isResized: resized,
    tiles,
    transparentColor,
  } satisfies SpriteBitmap;
}
