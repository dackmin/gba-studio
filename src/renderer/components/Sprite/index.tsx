import {
  type ComponentPropsWithoutRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import type { CharacterDirection, GameSpriteFile } from '../../../types';
import { getGraphicName, loadImage, tileToPixel } from '../../../helpers';
import { HORIZONTAL_FRAMES } from '../../services/sprites';

export interface SpriteProps extends ComponentPropsWithoutRef<'canvas'> {
  sprite?: GameSpriteFile;
  gridSize?: number;
  width?: number;
  height?: number;
  direction?: CharacterDirection;
  transparencyColor?: string;
  frame?: number;
  scale?: number;
}

const Sprite = ({
  style,
  sprite,
  gridSize,
  width: widthProp,
  height: heightProp,
  direction = 'down',
  transparencyColor = '#00ff00',
  scale = 1,
  ...rest
}: SpriteProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frames = useMemo(() => (
    HORIZONTAL_FRAMES.idle[direction]
  ), [direction]);

  const width = useMemo(() => (
    (widthProp
      ? tileToPixel(widthProp ?? 1, gridSize ?? 16)
      : (sprite?.width ?? gridSize ?? 16)) * scale
  ), [gridSize, sprite?.width, widthProp, scale]);

  const height = useMemo(() => (
    (heightProp
      ? tileToPixel(heightProp ?? 1, gridSize ?? 16)
      : (sprite?.height ?? gridSize ?? 16)) * scale
  ), [gridSize, sprite?.height, heightProp, scale]);

  const redraw = useCallback(async () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) {
      return;
    }

    const image = await loadImage(!sprite?._file
      ? `resources://public/templates/commons/graphics/sprite_default.bmp`
      : `project://graphics/${getGraphicName(sprite._file)}.bmp`);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      image,
      (Array.isArray(frames) ? frames[0] : frames) * (width / scale),
      0,
      width / scale,
      height / scale,
      0,
      0,
      width,
      height
    );

    // Apply transparency color
    if (transparencyColor) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const r = parseInt(transparencyColor.slice(1, 3), 16);
      const g = parseInt(transparencyColor.slice(3, 5), 16);
      const b = parseInt(transparencyColor.slice(5, 7), 16);

      for (let i = 0; i < data.length; i += 4) {
        if (data[i] === r && data[i + 1] === g && data[i + 2] === b) {
          data[i + 3] = 0; // Set alpha to 0
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }
  }, [sprite, width, height, frames, scale, transparencyColor]);

  useEffect(() => {
    requestAnimationFrame(redraw);
  }, [redraw]);

  return (
    <canvas
      ref={canvasRef}
      { ...rest }
      style={{
        ...style,
        imageRendering: 'pixelated',
        transform: direction === 'left' ? 'scaleX(-1)' : undefined,
      }}
      width={width}
      height={height}
    />
  );
};

export default Sprite;
