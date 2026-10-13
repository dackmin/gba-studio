import { type MouseEvent, useCallback, useMemo } from 'react';
import {
  type MoveableState,
  type MoveableProps,
  Moveable,
  classNames,
  useInfiniteCanvas,
} from '@junipero/react';
import { Card, ContextMenu } from '@radix-ui/themes';

import type { GameHud, GameHudSprite, GameHudText } from '../../../types';
import { useApp, useCanvas, usePreviewCursor } from '../../services/hooks';
import HudSprite from './HudSprite';
import HudText from './HudText';

// GBA screen size
export const HUD_WIDTH = 240;
export const HUD_HEIGHT = 160;

type HudItem = GameHudSprite | GameHudText;

export interface HudProps
  extends Omit<MoveableProps, 'onSelect' | 'onChange'> {
  hud: GameHud;
  preview?: boolean;
  onChange?: (hud: GameHud) => void;
  onSelect?: (hud: GameHud) => void;
  onSelectItem?: (hud: GameHud, item: HudItem) => void;
  onMove?: (hud: GameHud, e: MoveableState) => void;
  onDelete?: (hud?: GameHud) => void;
  onDeleteItem?: (item: HudItem) => void;
}

const Hud = ({
  ref,
  hud,
  className,
  preview = false,
  onChange,
  onSelect,
  onSelectItem,
  onMove,
  onDelete,
  onDeleteItem,
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

  // Lower z is drawn in front, like on the console
  const items = useMemo<HudItem[]>(() => (
    [...(hud.sprites || []), ...(hud.texts || [])]
      .sort((a, b) => (b.z ?? 0) - (a.z ?? 0))
  ), [hud.sprites, hud.texts]);

  const onSelect_ = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(hud);
  }, [onSelect, hud]);

  const onMovedItem = useCallback((
    item: HudItem,
    e: MoveableState
  ) => {
    item.x = Math.max(0, Math.round(e.deltaX));
    item.y = Math.max(0, Math.round(e.deltaY));
    onChange?.(hud);
  }, [onChange, hud]);

  const onSelectItem_ = useCallback((
    item: HudItem,
    e: MouseEvent<HTMLElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectItem?.(hud, item);
  }, [onSelectItem, hud]);

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
              { items.map(item => item.type === 'hud-text' ? (
                <HudText
                  key={item.id}
                  item={item}
                  onMoveEnd={onMovedItem.bind(null, item)}
                  onSelect={onSelectItem_.bind(null, item)}
                  onDelete={onDeleteItem?.bind(null, item)}
                />
              ) : (
                <HudSprite
                  key={item.id}
                  sprite={item}
                  onMoveEnd={onMovedItem.bind(null, item)}
                  onSelect={onSelectItem_.bind(null, item)}
                  onDelete={onDeleteItem?.bind(null, item)}
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
