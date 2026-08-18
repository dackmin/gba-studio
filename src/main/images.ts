import { Jimp } from 'jimp';
import { hsva2rgba, parseColor } from '@junipero/core';

interface ToBmpOptions {
  colors?: 16 | 256;
  transparentColor?: string;
}

type JimpImage = InstanceType<typeof Jimp>;

export function hexToRgb (hex: string): [number, number, number] {
  const { r, g, b } = hsva2rgba(parseColor(hex));

  return [r ?? 0, g ?? 0, b ?? 0];
}

export async function toBmp<T extends JimpImage> (
  image: T,
  opts?: ToBmpOptions,
): Promise<Buffer> {
  const colors = opts?.colors ?? 256;
  const transparentColor = hexToRgb(opts?.transparentColor ?? '#000');

  const { width, height, data } = image.bitmap;

  // Keep the original transparency mask.
  const alpha = new Uint8Array(width * height);

  for (let i = 0, pixel = 0; i < data.length; i += 4, pixel++) {
    alpha[pixel] = data[i + 3];
  }

  // Reserve one palette entry for transparency.
  image.quantize({ colors: colors - 1 });

  const { data: quantized } = image.bitmap;

  // Palette index 0 is always transparent.
  const palette: [number, number, number][] = [
    transparentColor,
  ];

  const paletteMap = new Map<number, number>();

  // Store palette
  for (let i = 0; i < quantized.length; i += 4) {
    const pixel = i / 4;

    // Transparent pixels don't participate in the palette.
    if (alpha[pixel] === 0) {
      continue;
    }

    const r = quantized[i];
    const g = quantized[i + 1];
    const b = quantized[i + 2];

    const rgb = (r << 16) | (g << 8) | b;

    if (!paletteMap.has(rgb)) {
      if (palette.length >= colors) {
        throw new Error(
          `Image contains more than ${colors - 1} opaque colors`,
        );
      }

      const index = palette.length;

      paletteMap.set(rgb, index);
      palette.push([r, g, b]);
    }
  }

  // BMP scanlines are padded to 4-byte boundaries.
  const rowSize = (width + 3) & ~3;
  const pixelDataSize = rowSize * height;

  const fileHeaderSize = 14;
  const infoHeaderSize = 40;

  // Keep a complete 16/256-entry palette.
  const paletteSize = colors * 4;

  const paletteOffset = fileHeaderSize + infoHeaderSize;
  const pixelOffset = paletteOffset + paletteSize;
  const fileSize = pixelOffset + pixelDataSize;

  const bmp = Buffer.alloc(fileSize);

  // BITMAPFILEHEADER
  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/ns-wingdi-bitmapfileheader
  bmp.writeUInt16LE(0x4d42, 0); // BfType -> "BM"
  bmp.writeUInt32LE(fileSize, 2); // BfSize
  bmp.writeUInt16LE(0, 6); // BfReserved1 (don't know)
  bmp.writeUInt16LE(0, 8); // BfReserved2 (don't know)
  bmp.writeUInt32LE(pixelOffset, 10); // BfOffBits

  // BITMAPINFOHEADER
  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/ns-wingdi-bitmapinfoheader
  bmp.writeUInt32LE(40, 14); // BiSize -> Header size
  bmp.writeInt32LE(width, 18); // BiWidth
  bmp.writeInt32LE(height, 22); // BiHeight
  bmp.writeUInt16LE(1, 26); // BiPlanes -> Always 1 (don't ask)
  bmp.writeUInt16LE(8, 28); // BiBitCount -> 8 bits per pixel (indexed)
  bmp.writeUInt32LE(0, 30); // BiCompression (BI_RGB) -> No compression for butano
  bmp.writeUInt32LE(pixelDataSize, 34); // BiSizeImage -> Size of pixel data
  bmp.writeInt32LE(0, 38); // BiXPelsPerMeter -> Resolution
  bmp.writeInt32LE(0, 42); // BiYPelsPerMeter -> Resolution
  // Some decoders use BiClrUsed to locate pixel data, so it must match the full reserved palette
  // size.
  // https://github.com/jimp-dev/bmp-ts/blob/master/src/decoder.ts#L101
  bmp.writeUInt32LE(colors, 46); // BiClrUsed -> Colors count
  bmp.writeUInt32LE(0, 50); // BiClrImportant -> Count of important colors (0 = all)

  // Write palette
  // BMP format = B,G,R,0 (alpha)
  // https://hexbase.dev/formats/bmp/
  for (let i = 0; i < palette.length; i++) {
    const [r, g, b] = palette[i];

    const offset = paletteOffset + i * 4;

    bmp[offset] = b;
    bmp[offset + 1] = g;
    bmp[offset + 2] = r;
    bmp[offset + 3] = 0;
  }

  // Then rewrite all pixels
  for (let y = 0; y < height; y++) {
    const sourceY = height - 1 - y;
    const destinationOffset = pixelOffset + y * rowSize;

    for (let x = 0; x < width; x++) {
      const pixel = sourceY * width + x;
      const sourceOffset = pixel * 4;

      // Transparent -> palette index 0.
      if (alpha[pixel] === 0) {
        bmp[destinationOffset + x] = 0;
        continue;
      }

      const r = quantized[sourceOffset];
      const g = quantized[sourceOffset + 1];
      const b = quantized[sourceOffset + 2];

      const rgb = (r << 16) | (g << 8) | b;

      const paletteIndex = paletteMap.get(rgb);

      if (paletteIndex === undefined) {
        throw new Error('Failed to find color in palette');
      }

      bmp[destinationOffset + x] = paletteIndex;
    }
  }

  return bmp;
}
