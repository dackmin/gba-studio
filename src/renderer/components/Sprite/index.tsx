import { ComponentPropsWithoutRef, useMemo } from 'react';

import type { Direction, GameSprite } from '../../../types';
import { getGraphicName, tileToPixel } from '../../../helpers';
import { HORIZONTAL_FRAMES } from '../../services/sprites';

export interface SpriteProps extends ComponentPropsWithoutRef<'div'> {
  sprite?: GameSprite;
  gridSize?: number;
  width?: number;
  height?: number;
  direction?: Direction;
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
  scale = 1,
  ...rest
}: SpriteProps) => {
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

  const position = useMemo(() => {
    if (Array.isArray(frames)) {
      return `-${frames[0] * width}px 0`;
    }

    return `-${frames * width}px 0`;
  }, [frames, width]);

  if (!sprite?._file) {
    return null;
  }

  return (
    <div
      { ...rest }
      style={{
        ...style,
        backgroundImage:
          `url(project://graphics/${getGraphicName(sprite._file)}.bmp)`,
        backgroundSize: 'cover',
        backgroundPosition: position,
        backgroundRepeat: 'no-repeat',
        // Flip for left direction
        transform: direction === 'left' ? 'scaleX(-1)' : undefined,
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
};

export default Sprite;
