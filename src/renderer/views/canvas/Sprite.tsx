import { type MouseEvent, useCallback, useMemo } from 'react';
import {
  type MoveableProps,
  Moveable,
  classNames,
  useInfiniteCanvas,
} from '@junipero/react';

import type { GameSprite } from '../../../types';
import { useApp, useCanvas } from '../../services/hooks';
import { tileToPixel } from '../../../helpers';
import InnerSprite from '../../components/Sprite';

export interface SpriteProps extends MoveableProps {
  sprite: GameSprite;
  gridSize?: number;
  preview?: boolean;
  onSelect?: (e: MouseEvent<HTMLDivElement>) => void;
}

const Sprite = ({
  sprite,
  gridSize = 16,
  preview = false,
  onSelect,
  onMoveEnd,
  ...rest
}: SpriteProps) => {
  const { zoom, mouseX, mouseY, offsetX, offsetY } = useInfiniteCanvas();
  const { tool, selectedItem } = useCanvas();
  const { sprites } = useApp();

  const getSprite = useCallback((name: string) => (
    sprites?.find(s => s._file === `${name}.json`)
  ), [sprites]);

  const previewPosition = useMemo(() => preview ? {
    x: Math.round((mouseX - offsetX) / zoom),
    y: Math.round((mouseY - offsetY) / zoom),
  } : null, [preview, mouseX, mouseY, offsetX, offsetY, zoom]);

  return (
    <Moveable
      { ...rest }
      transformScale={zoom}
      disabled={
        (tool === 'add' && !preview) || tool !== 'default' ||
        selectedItem !== sprite
      }
      x={preview ? previewPosition?.x : tileToPixel(sprite.x || 0, gridSize)}
      y={preview ? previewPosition?.y : tileToPixel(sprite.y || 0, gridSize)}
      onMouseDown={e => e.stopPropagation()}
      onMoveEnd={onMoveEnd}
      step={preview ? undefined : gridSize}
      style={{
        left: 0,
        top: 0,
        width: sprite.width
          ? tileToPixel(sprite.width, gridSize)
          : getSprite(sprite.sprite)?.width ?? gridSize,
        height: sprite.height
          ? tileToPixel(sprite.height, gridSize)
          : getSprite(sprite.sprite)?.height ?? gridSize,
      }}
    >
      <div className="absolute w-full h-full">
        <div className="relative w-full h-full">
          <div
            className={classNames(
              'absolute hover:border-1 border-(--accent-9)',
              'z-2 w-full h-full top-0 left-0',
              { 'border-1': selectedItem === sprite }
            )}
            onClick={onSelect}
          />
          <InnerSprite
            className="absolute z-1 top-0 left-0 pixelated"
            sprite={getSprite(sprite.sprite)}
            width={sprite.width}
            height={sprite.height}
            direction="down"
            gridSize={gridSize}
          />
        </div>
      </div>
    </Moveable>
  );
};

export default Sprite;
