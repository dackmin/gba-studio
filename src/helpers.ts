export const tileToPixel = (tile: number, gridSize: number) =>
  tile * gridSize;

export const pixelToTile = (pixel: number, gridSize: number) =>
  Math.floor(pixel / gridSize);

export const getGraphicName = (filePath?: string) => {
  if (!filePath) {
    return 'unknown';
  }

  return filePath.replace('.bmp', '').replace('.json', '');
};

export const getImageSize = async (src: string): Promise<[number, number]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve([img.width, img.height]);
    };

    img.onerror = reject;

    img.src = src;
  });
};
