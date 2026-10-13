import { type MouseEvent, useCallback, useMemo } from 'react';
import {
  type MoveableState,
  type MoveableProps,
  Moveable,
  classNames,
  useInfiniteCanvas,
} from '@junipero/react';
import { Card, ContextMenu } from '@radix-ui/themes';

import type { GameHud, GameHudSprite } from '../../../types';
import { useApp, useCanvas, usePreviewCursor } from '../../services/hooks';
import HudSprite from './HudSprite';

// GBA screen size
export const HUD_WIDTH = 240;
export const HUD_HEIGHT = 160;

export interface HudProps
  extends Omit<MoveableProps, 'onSelect' | 'onChange'> {
  hud: GameHud;
  preview?: boolean;
  onChange?: (hud: GameHud) => void;
  onSelect?: (hud: GameHud) => void;
  onSelectSprite?: (hud: GameHud, sprite: GameHudSprite) => void;
  onMove?: (hud: GameHud, e: MoveableState) => void;
  onDelete?: (hud?: GameHud) => void;
  onDeleteSprite?: (sprite: GameHudSprite) => void;
}

const Hud = ({
  ref,
  hud,
  className,
  preview = false,
  onChange,
  onSelect,
  onSelectSprite,
  onMove,
  onDelete,
  onDeleteSprite,
  ...rest
}: HudProps) => {
  const { zoom } = useInfiniteCanvas();
  const cursor = usePreviewCursor(preview);
  const { project } = useApp();
  const { selectedHud, selectedItem, tool } = useCanvas();

  const hudConfig = useMemo(() => (
    preview
      ? cursor
      : project?.huds?.find(h => h._file === hud._file || h.id === hud.id)
  ), [project, cursor, hud, preview]);

  const sprites = useMemo(() => (
    [...(hud.sprites || [])].sort((a, b) => (b.z ?? 0) - (a.z ?? 0))
  ), [hud.sprites]);

  const onSelect_ = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(hud);
  }, [onSelect, hud]);

  const onMovedSprite = useCallback((
    sprite: GameHudSprite,
    e: MoveableState
  ) => {
    sprite.x = Math.max(0, Math.round(e.deltaX));
    sprite.y = Math.max(0, Math.round(e.deltaY));
    onChange?.(hud);
  }, [onChange, hud]);

  const onSelectSprite_ = useCallback((
    sprite: GameHudSprite,
    e: MouseEvent<HTMLElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectSprite?.(hud, sprite);
  }, [onSelectSprite, hud]);

  return (
    <Moveable
      { ...rest }
      strategy="position"
      onMouseDown={onSelect_}
      onMove={onMove?.bind(null, hud)}
      transformScale={zoom}
      x={hudConfig?.x || 0}
      y={hudConfig?.y || 0}
      disabled={
        (tool === 'add' && preview) || tool !== 'default' ||
        selectedHud !== hud || !!selectedItem
      }
    >
      <div
        ref={ref}
        className={classNames(
          '!absolute select-none',
          { 'z-100': selectedHud === hud },
        )}
      >
        <span className="absolute block w-full left-0 bottom-full text-center">
          { hud.name }
        </span>
        <ContextMenu.Root>
          <ContextMenu.Trigger className="cursor-default!">
            <Card
              className={classNames(
                '!relative overflow-hidden transition-[outline-width]',
                'duration-200 !bg-(--gray-4)',
                { '!outline-4 !outline-(--accent-9)': selectedHud === hud },
                className
              )}
              style={{ width: HUD_WIDTH, height: HUD_HEIGHT }}
            >
              { sprites.map(sprite => (
                <HudSprite
                  key={sprite.id}
                  sprite={sprite}
                  onMoveEnd={onMovedSprite.bind(null, sprite)}
                  onSelect={onSelectSprite_.bind(null, sprite)}
                  onDelete={onDeleteSprite?.bind(null, sprite)}
                />
              )) }
            </Card>
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Label className="text-xs!">HUD</ContextMenu.Label>
            <ContextMenu.Item
              shortcut={window.electron.isDarwin ? '⌦' : 'Del'}
              onClick={onDelete?.bind(null, hud)}
            >
              Delete
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
      </div>
    </Moveable>
  );
};

export default Hud;
