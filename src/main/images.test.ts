import path from 'node:path';

import { Jimp } from 'jimp';

import {
  type JimpImage,
  cropIndexedImage,
  decodeIndexedBmp,
  encodeIndexedBmp,
  getBackgroundLayoutForImage,
  quantizeToPalette,
  resizeToFit,
  toBmp,
  getBackgroundLayout,
} from './images';

const getColorsCount = (image: JimpImage) => {
  const colors = new Set<string>();
  const { data } = image.bitmap;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    colors.add(`${r},${g},${b}`);
  }

  return colors.size;
};

describe('main/images', () => {
  describe('quantizeToPalette', () => {
    it('should quantize an image to the given palette', async () => {
      const image = await Jimp.read(path.resolve('./tests/fixtures/256-colors.png')) as any;

      expect(getColorsCount(image)).toBe(256);

      const { palette } = await quantizeToPalette(
        image,
        16,
        [0, 0, 0],
        false
      );

      expect(palette.length).toBeLessThanOrEqual(16);
      expect(getColorsCount(image)).toBeLessThanOrEqual(16);
    });
  });

  describe('toBMP', () => {
    it('should convert an image to BMP format', async () => {
      const image = await Jimp.read(path.resolve('./tests/fixtures/sprite.png')) as any;
      const { transparentColor } = await toBmp(image, {
        colors: 16,
      });

      expect(transparentColor).toEqual([0, 255, 0]);
    });
  });

  describe('resizeToFit', () => {
    it('should only pad backgrounds to a multiple of 8px, whatever their size', async () => {
      const image = new Jimp({ width: 1001, height: 603, color: 0xff0000ff }) as any;
      const { resized } = resizeToFit(image, 'background');

      expect(resized).toBe(true);
      expect(image.bitmap.width).toBe(1008);
      expect(image.bitmap.height).toBe(608);
      expect(image.bitmap.data[(1000 + 602 * 1008) * 4 + 3]).toBe(255);
      expect(image.bitmap.data[(1001 + 602 * 1008) * 4 + 3]).toBe(0);
      expect(image.bitmap.data[(0 + 603 * 1008) * 4 + 3]).toBe(0);
    });
  });

  describe('indexed BMP', () => {
    it('should round-trip and crop indexed images keeping the palette', async () => {
      const image = await Jimp.read(path.resolve('./tests/fixtures/sprite.png')) as any;
      const { buffer } = await toBmp(image, { colors: 256, matchTransparent: false });
      const decoded = decodeIndexedBmp(buffer);

      expect(decoded.width).toBe(image.bitmap.width);
      expect(decoded.height).toBe(image.bitmap.height);
      expect(encodeIndexedBmp(decoded).equals(buffer)).toBe(true);

      const cropped = cropIndexedImage(decoded, 8, 8, 64, 64);
      expect(cropped.palette).toBe(decoded.palette);
      expect(cropped.indices[0]).toBe(decoded.indices[8 * decoded.width + 8]);

      const outside = cropIndexedImage(decoded, decoded.width - 4, 0, 16, 8);
      expect(outside.indices[4]).toBe(0);
      expect(outside.indices[0]).toBe(decoded.indices[decoded.width - 4]);
    });
  });

  describe('getBackgroundLayoutForImage', () => {
    const image = (width: number, height: number, unique: boolean) => {
      const indices = new Uint8Array(width * height);

      if (unique) {
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const tile = (y >> 3) * (width >> 3) + (x >> 3);

            indices[y * width + x] = ((tile * 2654435761) >>> ((x & 7) + (y & 7) * 3)) & 0xff;
          }
        }
      }

      return { width, height, indices, palette: [[0, 0, 0] as [number, number, number]] };
    };

    it('should use a big map when tiles are repeated enough to fit in memory', () => {
      expect(getBackgroundLayoutForImage('bg', image(1100, 700, false)).mode).toBe('big');
    });

    it('should cut images with too many different tiles', () => {
      expect(getBackgroundLayoutForImage('bg', image(1100, 700, true)).mode).toBe('tiles');
    });

    it('should not change backgrounds fitting in 512x512', () => {
      expect(getBackgroundLayoutForImage('bg', image(300, 200, true)).mode).toBe('single');
    });
  });

  describe('getBackgroundLayout', () => {
    it('should keep backgrounds fitting in 512x512 as a single padded tile', () => {
      expect(getBackgroundLayout('bg', 240, 160).tiles)
        .toEqual([expect.objectContaining({ name: 'bg', width: 256, height: 256 })]);
      expect(getBackgroundLayout('bg', 304, 200).tiles)
        .toEqual([expect.objectContaining({ name: 'bg', width: 512, height: 256 })]);
      expect(getBackgroundLayout('bg', 512, 512).tiles)
        .toEqual([expect.objectContaining({ name: 'bg', width: 512, height: 512 })]);
    });

    it('should keep bigger backgrounds as a single big map when asked to', () => {
      const layout = getBackgroundLayout('bg', 2400, 1000, true);

      expect(layout.mode).toBe('big');
      expect(layout.tiles).toEqual([expect.objectContaining({
        name: 'bg', x: 0, y: 0, width: 2560, height: 1024,
      })]);
      expect(getBackgroundLayout('bg', 17000, 1000, true).mode).toBe('tiles');
    });

    it('should cut bigger backgrounds into a grid of 256x256 tiles', () => {
      const { tiles } = getBackgroundLayout('bg', 600, 520);

      expect(tiles).toHaveLength(9);
      expect(tiles[0]).toEqual({
        name: 'bg_tile_0_0', col: 0, row: 0, x: 0, y: 0, width: 256, height: 256,
      });
      expect(tiles[8]).toEqual({
        name: 'bg_tile_2_2', col: 2, row: 2, x: 512, y: 512, width: 256, height: 256,
      });
    });
  });
});
