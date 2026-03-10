import { exists } from '@junipero/react';

export const tileToPixel = (tile: number, gridSize: number) =>
  tile * gridSize;

export const pixelToTile = (pixel: number, gridSize: number) =>
  Math.floor(pixel / gridSize);

export const getSceneName = (filePath?: string) => {
  if (!filePath) {
    return 'unknown';
  }

  return filePath.replace('.json', '');
};

export const getGraphicName = (filePath?: string) => {
  if (!filePath) {
    return 'unknown';
  }

  return filePath.replace('.bmp', '').replace('.json', '');
};

export const getSoundName = (filePath?: string) => {
  if (!filePath) {
    return 'unknown';
  }

  return filePath.replace('.wav', '').replace('.mod', '');
};

export const loadImage = async (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve(img);
    };

    img.onerror = reject;

    img.src = src;
  });
};

export const getImageSize = async (src: string): Promise<[number, number]> => {
  const img = await loadImage(src);

  return [img.width, img.height];
};

export const getTilesCount = (
  width?: number,
  height?: number,
  gridSize?: number
): number => {
  width = width || 0;
  height = height || 0;

  if (!exists(gridSize)) {
    gridSize = width > height ? width : height;
  }

  return Math.max(Math.ceil(width / gridSize!), Math.ceil(height / gridSize!));
};
