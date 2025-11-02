import { type MouseEvent, useCallback, useMemo } from 'react';
import {
  type MoveableProps,
  Moveable,
  classNames,
  useInfiniteCanvas,
} from '@junipero/react';

import type { GameActor } from '../../../types';
import { useApp, useCanvas } from '../../services/hooks';
import { tileToPixel } from '../../../helpers';
import Sprite from '../../components/Sprite';

export interface ActorProps extends MoveableProps {
  actor: GameActor;
  gridSize?: number;
  preview?: boolean;
  onSelect?: (e: MouseEvent<HTMLDivElement>) => void;
}

const Actor = ({
  actor,
  gridSize = 16,
  preview = false,
  onSelect,
  onMoveEnd,
  ...rest
}: ActorProps) => {
  const { zoom, mouseX, mouseY, offsetX, offsetY } = useInfiniteCanvas();
  const { sprites } = useApp();
  const { tool, selectedItem } = useCanvas();

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
        selectedItem !== actor
      }
      x={preview ? previewPosition?.x : tileToPixel(actor.x || 0, gridSize)}
      y={preview ? previewPosition?.y : tileToPixel(actor.y || 0, gridSize)}
      onMouseDown={e => e.stopPropagation()}
      onMoveEnd={onMoveEnd}
      step={preview ? undefined : gridSize}
      style={{
        left: 0,
        top: 0,
        width: actor.width
          ? tileToPixel(actor.width, gridSize)
          : getSprite(actor.sprite)?.width ?? gridSize,
        height: actor.height
          ? tileToPixel(actor.height, gridSize)
          : getSprite(actor.sprite)?.height ?? gridSize,
      }}
    >
      <div className="absolute w-full h-full">
        <div className="relative w-full h-full">
          <div
            className={classNames(
              'absolute bg-pink-500/50 border-2',
              'border-pink-500 z-2 w-full h-full top-0 left-0',
              { 'bg-pink-500/70': selectedItem === actor }
            )}
            onClick={onSelect}
          />
          <Sprite
            className="absolute z-1 top-0 left-0 pixelated"
            sprite={getSprite(actor.sprite)}
            width={actor.width}
            height={actor.height}
            direction={actor.direction}
            gridSize={gridSize}
          />
        </div>
      </div>
    </Moveable>
  );
};

export default Actor;
