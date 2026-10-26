import {
  intToRGBA,
  Jimp,
  HorizontalAlign,
  ResizeStrategy,
  VerticalAlign,
} from 'jimp';
import { denormalizeRGBA, hsva2rgba, parseColor } from '@junipero/core';

import type { BackgroundLayout, BackgroundTile } from '../types';
import {
  BACKGROUND_MAX_BIG_SIZE,
  BACKGROUND_MAX_SINGLE_SIZE,
  BACKGROUND_TILE_SIZE,
  BACKGROUND_VRAM_TILES_BUDGET,
} from '../commons';

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
export function quantizeToPalette<T extends JimpImage> (
  image: T,
  colors: number,
  transparentColor: [number, number, number],
  matchTransparent: boolean,
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

    if (
      matchTransparent &&
      quantized[i] === transparentColor[0] &&
      quantized[i + 1] === transparentColor[1] &&
      quantized[i + 2] === transparentColor[2]
    ) {
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
   * The color to reserve as the transparent palette entry (index 0) when quantizing the image.
   * When omitted, the color of the first pixel is used instead.
   */
  transparentColor?: string;
  /**
   * Whether opaque pixels matching the transparent color are keyed out (treated as transparent).
   * Enabled by default, like for sprites and fonts whose transparency color is customizable in
   * the editor. Must be disabled for backgrounds: users can't customize the background
   * transparency color, so nothing else than actually transparent pixels (transparent PNG holes
   * and resize padding) is allowed to be keyed out.
   */
  matchTransparent?: boolean;
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
  const transparentColor = opts?.transparentColor
    ? hexToRgb(opts.transparentColor)
    : undefined;

  // Transparent color is by default the color of the first pixel, unless specified otherwise.
  let finalTransparentColor = transparentColor;

  if (!finalTransparentColor) {
    const firstPixel = intToRGBA(image.getPixelColor(0, 0));
    finalTransparentColor = [firstPixel.r, firstPixel.g, firstPixel.b];
  }

  const { width, height, indices, palette } = quantizeToPalette(
    image,
    colors,
    finalTransparentColor,
    opts?.matchTransparent ?? true,
  );
  const tiles = countUniqueTiles(indices, width, height, opts);
  const buffer = encodeIndexedBmp({ width, height, indices, palette }, colors);

  return { buffer, tiles, transparentColor: finalTransparentColor };
}

export function encodeIndexedBmp (
  { width, height, indices, palette }: QuantizedImage,
  colors: number = 256,
): Buffer {
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

  return bmp;
}

export function decodeIndexedBmp (bmp: Buffer): QuantizedImage {
  if (bmp.length < 54 || bmp.readUInt16LE(0) !== 0x4d42) {
    throw new Error('Not a BMP file');
  }

  const pixelOffset = bmp.readUInt32LE(10);
  const headerSize = bmp.readUInt32LE(14);
  const width = bmp.readInt32LE(18);
  const rawHeight = bmp.readInt32LE(22);
  const bitCount = bmp.readUInt16LE(28);
  const compression = bmp.readUInt32LE(30);

  if (bitCount !== 8 || compression !== 0) {
    throw new Error('Only uncompressed 8bpp indexed BMP files are supported');
  }

  const topDown = rawHeight < 0;
  const height = Math.abs(rawHeight);
  const paletteOffset = 14 + headerSize;
  const colors = Math.min(
    256,
    bmp.readUInt32LE(46) || (pixelOffset - paletteOffset) / 4,
  );
  const palette: [number, number, number][] = [];

  for (let i = 0; i < colors; i++) {
    const offset = paletteOffset + i * 4;

    palette.push([bmp[offset + 2], bmp[offset + 1], bmp[offset]]);
  }

  const rowSize = (width + 3) & ~3;
  const indices = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    const sourceOffset = pixelOffset + (topDown ? y : height - 1 - y) * rowSize;

    indices.set(bmp.subarray(sourceOffset, sourceOffset + width), y * width);
  }

  return { width, height, indices, palette };
}

export interface BackgroundTilesCount {
  largest: number;
  loaded: number;
}

export function getBackgroundLayoutForImage (
  fileName: string,
  image: QuantizedImage,
): BackgroundLayout {
  const layout = getBackgroundLayout(fileName, image.width, image.height);

  if (layout.mode === 'single') {
    return layout;
  }

  const tiles = countUniqueTiles(image.indices, image.width, image.height, {
    limit: BACKGROUND_VRAM_TILES_BUDGET,
  });

  return tiles <= BACKGROUND_VRAM_TILES_BUDGET
    ? getBackgroundLayout(fileName, image.width, image.height, true)
    : layout;
}

export function countBackgroundTiles (
  image: QuantizedImage,
  layout: BackgroundLayout,
  opts?: Parameters<typeof countUniqueTiles>[3],
): BackgroundTilesCount {
  const { tiles } = layout;
  const cols = Math.max(...tiles.map(tile => tile.col)) + 1;
  const rows = Math.max(...tiles.map(tile => tile.row)) + 1;

  const counts = tiles.map(tile => {
    const cropped = cropIndexedImage(image, tile.x, tile.y, tile.width, tile.height);

    return countUniqueTiles(cropped.indices, cropped.width, cropped.height, opts);
  });

  let loaded = 0;

  for (let row = 0; row < Math.max(1, rows - 1); row++) {
    for (let col = 0; col < Math.max(1, cols - 1); col++) {
      let sum = 0;

      for (let dy = 0; dy < Math.min(2, rows); dy++) {
        for (let dx = 0; dx < Math.min(2, cols); dx++) {
          sum += counts[(row + dy) * cols + col + dx];
        }
      }

      loaded = Math.max(loaded, sum);
    }
  }

  return { largest: Math.max(...counts), loaded };
}

export function cropIndexedImage (
  image: QuantizedImage,
  x: number,
  y: number,
  width: number,
  height: number,
): QuantizedImage {
  const indices = new Uint8Array(width * height);
  const copyWidth = Math.max(0, Math.min(width, image.width - x));

  for (let row = 0; row < height && y + row < image.height; row++) {
    const sourceOffset = (y + row) * image.width + x;

    indices.set(
      image.indices.subarray(sourceOffset, sourceOffset + copyWidth),
      row * width,
    );
  }

  return { width, height, indices, palette: image.palette };
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
    limit?: number;
  },
): number {
  const repeatedTilesReduction = opts?.repeatedTilesReduction ?? true;
  const flippedTilesReduction = opts?.flippedTilesReduction ?? true;

  const tilesX = Math.ceil(width / 8);
  const tilesY = Math.ceil(height / 8);

  if (!repeatedTilesReduction) {
    return tilesX * tilesY;
  }

  // Grit always keeps an empty tile first
  const seen = new Set<string>([new Uint8Array(64).join(',')]);

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const tile = extractTile(indices, width, height, tx * 8, ty * 8);

      seen.add(tileKey(tile, flippedTilesReduction));

      if (opts?.limit !== undefined && seen.size > opts.limit) {
        return seen.size;
      }
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
  const { r, g, b } = denormalizeRGBA(hsva2rgba(parseColor(hex)));

  return [r ?? 0, g ?? 0, b ?? 0];
}

export function resizeToFit <T extends JimpImage> (
  image: T,
  mode: 'sprite' | 'background' | 'font',
) {
  let resized = false;

  switch (mode) {
    case 'font': {
      // A font is a vertical strip of glyphs: the image must be exactly 8px
      // wide, with one glyph stacked below the other. Both dimensions are
      // padded up to a multiple of 8 so grit can slice it into tiles.
      const targetWidth = roundUpToTile(image.bitmap.width);

      if (targetWidth !== image.bitmap.width) {
        resized = true;
        image.contain({
          w: targetWidth,
          h: image.bitmap.height,
          // Pad on the right only, so existing glyphs keep their alignment.
          align: HorizontalAlign.LEFT | VerticalAlign.TOP,
          mode: ResizeStrategy.NEAREST_NEIGHBOR,
        });
      }

      const targetHeight = roundUpToTile(image.bitmap.height);

      if (targetHeight !== image.bitmap.height) {
        resized = true;
        image.contain({
          w: image.bitmap.width,
          h: targetHeight,
          // Pad on the bottom only, so existing glyphs keep their alignment.
          align: HorizontalAlign.LEFT | VerticalAlign.TOP,
          mode: ResizeStrategy.NEAREST_NEIGHBOR,
        });
      }

      break;
    }
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
      const targetWidth = roundUpToTile(image.bitmap.width);
      const targetHeight = roundUpToTile(image.bitmap.height);

      if (targetWidth !== image.bitmap.width || targetHeight !== image.bitmap.height) {
        resized = true;
        const padded = new Jimp({ width: targetWidth, height: targetHeight, color: 0x00000000 });
        padded.composite(image, 0, 0);
        image.bitmap = padded.bitmap;
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

export const getBackgroundLayout = (
  fileName: string,
  width: number,
  height: number,
  big: boolean = false,
): BackgroundLayout => {
  if (width <= BACKGROUND_MAX_SINGLE_SIZE && height <= BACKGROUND_MAX_SINGLE_SIZE) {
    return {
      mode: 'single',
      width,
      height,
      tiles: [{
        name: fileName,
        col: 0,
        row: 0,
        x: 0,
        y: 0,
        width: width <= BACKGROUND_TILE_SIZE ? BACKGROUND_TILE_SIZE : BACKGROUND_MAX_SINGLE_SIZE,
        height: height <= BACKGROUND_TILE_SIZE ? BACKGROUND_TILE_SIZE : BACKGROUND_MAX_SINGLE_SIZE,
      }],
    };
  }

  const cols = Math.ceil(width / BACKGROUND_TILE_SIZE);
  const rows = Math.ceil(height / BACKGROUND_TILE_SIZE);

  if (
    big &&
    cols * BACKGROUND_TILE_SIZE <= BACKGROUND_MAX_BIG_SIZE &&
    rows * BACKGROUND_TILE_SIZE <= BACKGROUND_MAX_BIG_SIZE
  ) {
    return {
      mode: 'big',
      width,
      height,
      tiles: [{
        name: fileName,
        col: 0,
        row: 0,
        x: 0,
        y: 0,
        width: cols * BACKGROUND_TILE_SIZE,
        height: rows * BACKGROUND_TILE_SIZE,
      }],
    };
  }

  const tiles: BackgroundTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      tiles.push({
        name: `${fileName}_tile_${col}_${row}`,
        col,
        row,
        x: col * BACKGROUND_TILE_SIZE,
        y: row * BACKGROUND_TILE_SIZE,
        width: BACKGROUND_TILE_SIZE,
        height: BACKGROUND_TILE_SIZE,
      });
    }
  }

  return { mode: 'tiles', width, height, tiles };
};
