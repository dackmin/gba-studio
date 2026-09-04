import { type MouseEvent, useCallback, useMemo } from 'react';
import {
  type MoveableProps,
  Moveable,
  classNames,
  useInfiniteCanvas,
} from '@junipero/react';
import { ContextMenu } from '@radix-ui/themes';

import type { GameActor } from '../../../types';
import { useApp, useCanvas } from '../../services/hooks';
import { findSprite, tileToPixel } from '../../../helpers';
import Sprite from '../../components/Sprite';

export interface ActorProps extends MoveableProps {
  actor: GameActor;
  gridSize?: number;
  preview?: boolean;
  onSelect?: (e?: MouseEvent<HTMLElement>) => void;
  onDelete?: () => void;
}

const Actor = ({
  actor,
  gridSize = 16,
  preview = false,
  onSelect,
  onDelete,
  onMoveEnd,
  ...rest
}: ActorProps) => {
  const { zoom, mouseX, mouseY, offsetX, offsetY } = useInfiniteCanvas();
  const { sprites } = useApp();
  const { tool, selectedItem } = useCanvas();

  const onSelect_ = useCallback((e?: MouseEvent<HTMLElement>) => {
    e?.stopPropagation();
    onSelect?.(e);
  }, [onSelect]);

  const actorSprite = useMemo(() => (
    findSprite(sprites, actor.sprite)
  ), [sprites, actor.sprite]);

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
      onMouseDown={onSelect_}
      onMoveEnd={onMoveEnd}
      step={preview ? undefined : gridSize}
      style={{
        left: 0,
        top: 0,
        width: actor.width
          ? tileToPixel(actor.width, gridSize)
          : actorSprite?.width ?? gridSize,
        height: actor.height
          ? tileToPixel(actor.height, gridSize)
          : actorSprite?.height ?? gridSize,
      }}
    >
      <div className="absolute w-full h-full">
        <ContextMenu.Root>
          <ContextMenu.Trigger>
            <div className="relative w-full h-full">
              <div
                className={classNames(
                  'absolute hover:border-1 border-(--accent-9)',
                  'z-2 w-full h-full top-0 left-0',
                  { 'border-1': selectedItem === actor }
                )}
              />
              <Sprite
                className="absolute z-1 top-0 left-0 pixelated"
                sprite={actorSprite}
                width={actor.width}
                height={actor.height}
                direction={actor.direction}
                gridSize={gridSize}
                transparencyColor={actorSprite?.transparentColor}
              />
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Label className="text-xs!">Actor</ContextMenu.Label>
            <ContextMenu.Item
              onClick={onDelete}
              shortcut={window.electron.isDarwin ? '⌦' : 'Del'}
            >
              Delete
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
      </div>
    </Moveable>
  );
};

export default Actor;
