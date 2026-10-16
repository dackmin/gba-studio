import path from 'node:path';

import { Jimp } from 'jimp';

import { type JimpImage, quantizeToPalette, toBmp } from './images';

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
});
