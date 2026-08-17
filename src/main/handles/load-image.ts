import type { IpcMainInvokeEvent } from 'electron';
import { Jimp, type Bitmap } from 'jimp';

import type { SpriteBitmap } from '../../types';

type BmpDecoder = Bitmap & {
  palette?: any[];
  compression: number;
};

export default async function (
  _: IpcMainInvokeEvent,
  filePath: string,
) {
  const image = await Jimp.read(filePath);
  const bitmap = image.bitmap as BmpDecoder;

  return {
    width: image.bitmap.width,
    height: image.bitmap.height,
    data: await image.getBase64(image.mime as Parameters<typeof image.getBase64>[0]),
    mime: image.mime,
    isIndexed: (bitmap.palette?.length || 0) > 0,
    isCompressed: bitmap.compression !== 0,
  } satisfies SpriteBitmap;
}
