/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';

import { Jimp } from 'jimp';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 <input-bmp-file> [output-bmp-file] [tile-size]')
  .example(
    '$0 assets/gbs_mono.bmp assets/gbs_mono_vertical.bmp 8',
    'Process font from assets/gbs_mono.bmp, output to ' +
      'assets/gbs_mono_vertical.bmp with 8px tiles'
  )
  .demandCommand(1, 'You must provide the input BMP file path')
  .option('output', {
    alias: 'o',
    type: 'string',
    description: 'Output BMP file path',
  })
  .option('tile-size', {
    alias: 't',
    type: 'number',
    default: 8,
    description: 'Size of each character tile in pixels (default: 8)',
  })
  .help()
  .alias('help', 'h')
  .parseSync();

const processFont = async (
  inputPath: string = '',
  outputPath: string = '',
  tileSize: number = 8
): Promise<void> => {
  try {
    console.log(`Processing font from: ${inputPath}`);

    // Load the input bitmap
    const inputImage = await Jimp.read(inputPath);
    const { width, height } = inputImage.bitmap;

    console.log(`Input image dimensions: ${width}x${height}`);

    // Calculate how many tiles we have horizontally and vertically
    const tilesPerRow = Math.floor(width / tileSize);
    const tilesPerColumn = Math.floor(height / tileSize);
    const totalTiles = tilesPerRow * tilesPerColumn;

    console.log(
      `Tiles per row: ${tilesPerRow}, Tiles per column: ${tilesPerColumn}`
    );
    console.log(`Total tiles: ${totalTiles}`);

    // Create output image with all tiles arranged vertically
    const outputHeight = totalTiles * tileSize;
    const outputImage = new Jimp({
      width: tileSize,
      height: outputHeight,
    });

    console.log(
      `Output image dimensions: ${tileSize}x${outputHeight}`
    );

    let currentOutputY = 0;

    for (let row = 0; row < tilesPerColumn; row++) {
      for (let col = 0; col < tilesPerRow; col++) {
        // Extract tile from input
        const tileX = col * tileSize;
        const tileY = row * tileSize;

        // Create a new image for this tile
        const tile = inputImage.clone().crop({
          x: tileX,
          y: tileY,
          w: tileSize,
          h: tileSize,
        });

        // Place tile in output image
        outputImage.composite(tile, 0, currentOutputY);

        currentOutputY += tileSize;

        console.log(
          `Processed tile at (${col}, ${row}) -> ` +
          `output Y: ${currentOutputY - tileSize}`
        );
      }
    }

    // Save the output image
    await outputImage.write(outputPath as `${string}.${string}`);
    console.log(
      `Font processing complete! Output saved to: ${outputPath}`
    );

  } catch (error) {
    console.error('Error processing font:', error);
    throw error;
  }
};

(async () => {
  const inputPath = path.resolve(argv._[0] as string);
  const outputPath = argv._[1]
    ? path.resolve(argv._[1] as string)
    : path.resolve(
      path.dirname(inputPath),
      path.basename(inputPath, '.bmp') + '_vertical.bmp'
    );
  const tileSize = argv._[2] ? parseInt(argv._[2] as string, 10) : 8;

  // Validate input file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file does not exist: ${inputPath}`);
    process.exit(1);
  }

  // Validate tile size
  if (isNaN(tileSize) || tileSize <= 0) {
    console.error(
      `Invalid tile size: ${argv._[2]}. Must be a positive number.`
    );
    process.exit(1);
  }

  console.log(`Input: ${inputPath}`);
  console.log(`Output: ${outputPath}`);
  console.log(`Tile size: ${tileSize}px`);

  try {
    await processFont(inputPath, outputPath, tileSize);
  } catch (error) {
    console.error('Failed to process font:', error);
    process.exit(1);
  }
})();
