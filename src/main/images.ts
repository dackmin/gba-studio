import {
  intToRGBA,
  Jimp,
  HorizontalAlign,
  ResizeStrategy,
  VerticalAlign,
} from 'jimp';
import { hsva2rgba, parseColor } from '@junipero/core';

export type JimpImage = InstanceType<typeof Jimp>;

export interface QuantizedImage {
  /**
   * Image width
   */
  width: number;
  /**
   * Image height
   */
  height: number;
  /**
   * Palette index per pixel; 0 is always the reserved transparent entry.
   */
  indices: Uint8Array;
  /**
   * The palette of colors used in the image, including the reserved transparent entry at index 0.
   */
  palette: [number, number, number][];
}

// Quantizes the image down to `colors` palette entries (1 reserved for transparency), the same
// way butano's BMPs are indexed for grit
function quantizeToPalette<T extends JimpImage> (
  image: T,
  colors: number,
  transparentColor: [number, number, number],
): QuantizedImage {
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
  const indices = new Uint8Array(width * height);

  for (let i = 0, pixel = 0; i < quantized.length; i += 4, pixel++) {
    // Transparent pixels don't participate in the palette and keep index 0.
    if (alpha[pixel] === 0) {
      continue;
    }

    // Pixels with the same color as transparentColor either
    if (quantized[i] === transparentColor[0] &&
        quantized[i + 1] === transparentColor[1] &&
        quantized[i + 2] === transparentColor[2]) {
      continue;
    }

    const r = quantized[i];
    const g = quantized[i + 1];
    const b = quantized[i + 2];

    const rgb = (r << 16) | (g << 8) | b;

    let index = paletteMap.get(rgb);

    if (index === undefined) {
      if (palette.length >= colors) {
        throw new Error(
          `Image contains more than ${colors - 1} opaque colors`,
        );
      }

      index = palette.length;
      paletteMap.set(rgb, index);
      palette.push([r, g, b]);
    }

    indices[pixel] = index;
  }

  return { width, height, indices, palette };
}

export interface ToBmpOptions {
  /**
   * The number of colors to quantize the image down to, including the reserved transparent color.
   * Must be 16 (gbc) or 256 (gba). Defaults to 256.
   */
  colors?: 16 | 256;
  /**
   * The color to treat as transparent when quantizing the image. Defaults to black (#000).
   */
  transparentColor?: string;
  /**
   * Matches grit's `-mRt` (identical 8x8 tiles reused instead of duplicated). On by default,
   * like butano_graphics_tool.py does for regular/affine backgrounds.
   */
  repeatedTilesReduction?: boolean;
  /**
   * Matches grit's `-mRf` (horizontally/vertically flipped tiles reused too). On by default.
   */
  flippedTilesReduction?: boolean;
}

export interface BmpResult {
  /**
   * The BMP file data
   */
  buffer: Buffer;
  /**
   * Estimated tile count grit would generate for this image (see countUniqueTiles).
   */
  tiles: number;

  /**
   * The color treated as transparent when quantizing the image.
   */
  transparentColor: [number, number, number];
}

export async function toBmp<T extends JimpImage> (
  image: T,
  opts?: ToBmpOptions,
): Promise<BmpResult> {
  const colors = opts?.colors ?? 256;
  let transparentColor = opts?.transparentColor ? hexToRgb(opts?.transparentColor) : undefined;

  // Transparent color is usually the color of the first pixel
  if (!transparentColor) {
    const firstPixel = intToRGBA(image.getPixelColor(0, 0));
    transparentColor = [firstPixel.r, firstPixel.g, firstPixel.b];
  }

  transparentColor ??= [0, 0, 0];

  const { width, height, indices, palette } = quantizeToPalette(image, colors, transparentColor);
  const tiles = countUniqueTiles(indices, width, height, opts);

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
      bmp[destinationOffset + x] = indices[sourceY * width + x];
    }
  }

  return { buffer: bmp, tiles, transparentColor };
}

/**
 * Estimates the tile count grit would generate for a background/tileset, without actually
 * running it. A "tile" is an 8x8px block; grit reduces the tileset by reusing tiles that are
 * identical (and, optionally, their horizontal/vertical/both-flipped variants) instead of storing
 * duplicates, so the final count can be much lower than (width / 8) * (height / 8). `indices` are
 * post-quantize palette indices (e.g. from quantizeToPalette), not raw RGBA.
 */
export function countUniqueTiles (
  indices: Uint8Array,
  width: number,
  height: number,
  opts?: {
    repeatedTilesReduction?: boolean;
    flippedTilesReduction?: boolean;
  },
): number {
  const repeatedTilesReduction = opts?.repeatedTilesReduction ?? true;
  const flippedTilesReduction = opts?.flippedTilesReduction ?? true;

  const tilesX = Math.ceil(width / 8);
  const tilesY = Math.ceil(height / 8);

  if (!repeatedTilesReduction) {
    return tilesX * tilesY;
  }

  const seen = new Set<string>();

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const tile = extractTile(indices, width, height, tx * 8, ty * 8);

      seen.add(tileKey(tile, flippedTilesReduction));
    }
  }

  return seen.size;
}

/**
 * Reads an 8x8 block of palette indices, padding with transparent (index 0) past image edges.
 */
export function extractTile (
  indices: Uint8Array,
  width: number,
  height: number,
  originX: number,
  originY: number,
): Uint8Array {
  const tile = new Uint8Array(64);

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const px = originX + x;
      const py = originY + y;

      tile[y * 8 + x] = px < width && py < height ? indices[py * width + px] : 0;
    }
  }

  return tile;
}

/**
 * The key is the smallest of the tile's own and its flipped variants, so identical
 * tiles under any of those orientations collapse to the same key.
 */
export function tileKey (indices: Uint8Array, includeFlips: boolean): string {
  const normal = indices.join(',');

  if (!includeFlips) {
    return normal;
  }

  const flipH = flipTile(indices, true, false);
  const flipV = flipTile(indices, false, true);
  const flipHV = flipTile(indices, true, true);

  return [normal, flipH, flipV, flipHV].sort()[0];
}

/**
 * Flips an 8x8 tile of palette indices horizontally and/or vertically, returning a string key.
 */
export function flipTile (indices: Uint8Array, horizontal: boolean, vertical: boolean): string {
  const result = new Uint8Array(64);

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const srcX = horizontal ? 7 - x : x;
      const srcY = vertical ? 7 - y : y;

      result[y * 8 + x] = indices[srcY * 8 + srcX];
    }
  }

  return result.join(',');
}

export function hexToRgb (hex: string): [number, number, number] {
  const { r, g, b } = hsva2rgba(parseColor(hex));

  return [r ?? 0, g ?? 0, b ?? 0];
}

export function resizeToFit <T extends JimpImage> (
  image: T,
  mode: 'sprite' | 'background',
) {
  let resized = false;

  switch (mode) {
    case 'sprite': {
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

      // The smallest dimension is a single frame's cross axis, so it can't exceed the biggest
      // sprite
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

      break;
    }
    case 'background': {
      // Butano background size chart
      // https://gvaliente.github.io/butano/import.html#import_regular_bg
      // Much simpler -> 256x256, 256x512, 512x256 or 512x512
      const targetWidth = image.bitmap.width <= 256 ? 256 : 512;
      const targetHeight = image.bitmap.height <= 256 ? 256 : 512;

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

      break;
    }
  }

  return { image, resized };
}

// A single sprite frame is at least 8x8, so sprite sheets (grids of frames)
// only need each dimension padded up to a multiple of 8 to stay valid.
function roundUpToTile (value: number, tileSize: number = 8): number {
  return Math.ceil(value / tileSize) * tileSize;
}
