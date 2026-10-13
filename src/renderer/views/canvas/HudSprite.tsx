import { type MouseEvent, useCallback } from 'react';
import {
  type MoveableProps,
  Moveable,
  classNames,
  useInfiniteCanvas,
} from '@junipero/react';
import { ContextMenu } from '@radix-ui/themes';

import type { GameHudSprite } from '../../../types';
import { useApp, useCanvas, usePreviewCursor } from '../../services/hooks';
import { findSprite } from '../../../helpers';
import InnerSprite from '../../components/Sprite';

export interface HudSpriteProps extends MoveableProps {
  sprite: GameHudSprite;
  preview?: boolean;
  onSelect?: (e: MouseEvent<HTMLElement>) => void;
  onDelete?: () => void;
}

const HudSprite = ({
  sprite,
  preview = false,
  onSelect,
  onMoveEnd,
  onDelete,
  ...rest
}: HudSpriteProps) => {
  const { zoom } = useInfiniteCanvas();
  const cursor = usePreviewCursor(preview);
  const { tool, selectedItem } = useCanvas();
  const { sprites } = useApp();
  const spriteFile = findSprite(sprites, sprite.sprite);

  const onSelect_ = useCallback((e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    onSelect?.(e);
  }, [onSelect]);

  return (
    <Moveable
      { ...rest }
      transformScale={zoom}
      disabled={
        (tool === 'add' && !preview) || tool !== 'default' ||
        selectedItem !== sprite
      }
      x={preview ? cursor?.x : sprite.x || 0}
      y={preview ? cursor?.y : sprite.y || 0}
      onMouseDown={onSelect_}
      onMoveEnd={onMoveEnd}
      style={{
        left: 0,
        top: 0,
        width: spriteFile?.width ?? 16,
        height: spriteFile?.height ?? 16,
      }}
    >
      <div className="absolute w-full h-full">
        <ContextMenu.Root>
          <ContextMenu.Trigger className="cursor-default!">
            <div className="relative w-full h-full">
              <div
                className={classNames(
                  'absolute hover:border-1 border-(--accent-9)',
                  'z-2 w-full h-full top-0 left-0',
                  { 'border-1': selectedItem === sprite },
                )}
              />
              <InnerSprite
                className="absolute z-1 top-0 left-0 pixelated"
                sprite={spriteFile}
                direction="down"
              />
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Label className="text-xs!">HUD Sprite</ContextMenu.Label>
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

export default HudSprite;
