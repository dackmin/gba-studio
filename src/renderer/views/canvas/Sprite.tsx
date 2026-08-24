import { type MouseEvent, useCallback, useMemo } from 'react';
import {
  type MoveableProps,
  Moveable,
  classNames,
  useInfiniteCanvas,
} from '@junipero/react';
import { ContextMenu } from '@radix-ui/themes';

import type { GameSprite } from '../../../types';
import { useApp, useCanvas } from '../../services/hooks';
import { findSprite, tileToPixel } from '../../../helpers';
import InnerSprite from '../../components/Sprite';

export interface SpriteProps extends MoveableProps {
  sprite: GameSprite;
  gridSize?: number;
  preview?: boolean;
  onSelect?: (e: MouseEvent<HTMLElement>) => void;
  onDelete?: () => void;
}

const Sprite = ({
  sprite,
  gridSize = 16,
  preview = false,
  onSelect,
  onMoveEnd,
  onDelete,
  ...rest
}: SpriteProps) => {
  const { zoom, mouseX, mouseY, offsetX, offsetY } = useInfiniteCanvas();
  const { tool, selectedItem } = useCanvas();
  const { sprites } = useApp();

  const getSprite = useCallback((name: string) => (
    findSprite(sprites, name)
  ), [sprites]);

  const onSelect_ = useCallback((e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    onSelect?.(e);
  }, [onSelect]);

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
      onMouseDown={onSelect_}
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
        <ContextMenu.Root>
          <ContextMenu.Trigger>
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
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Label className="text-xs!">Sprite</ContextMenu.Label>
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

export default Sprite;
