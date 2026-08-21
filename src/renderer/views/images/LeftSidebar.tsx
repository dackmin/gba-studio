import { type ComponentPropsWithoutRef, useCallback } from 'react';
import { classNames } from '@junipero/react';
import { Text, ContextMenu } from '@radix-ui/themes';
import { ImageIcon } from '@radix-ui/react-icons';

import type { GameBackgroundFile, GameSpriteFile } from '../../../types';
import { useApp, useLocalData, useSprite } from '../../services/hooks';
import Collapsible from '../../components/Collapsible';

export interface LeftSidebarProps extends ComponentPropsWithoutRef<'div'> {}

export interface LeftSidebarState {
  deleting: boolean;
  selected?: GameSpriteFile | GameBackgroundFile;
}

const LeftSidebar = ({
  className,
}: LeftSidebarProps) => {
  const { sprites, backgrounds, onCanvasChange, ...appPayload } = useApp();
  const { collapse, isCollapsed } = useLocalData();
  const { selectedSprite, selectedBackground, selectSprite, selectBackground } = useSprite();

  const onDeleteSprite = useCallback(async () => {
    if (!selectedSprite) {
      return;
    }

    const updatedSprites = sprites.filter(s => s._file !== selectedSprite._file);
    onCanvasChange?.({
      ...appPayload,
      backgrounds,
      sprites: updatedSprites,
    });
    selectSprite?.(updatedSprites[0]);
  }, [selectedSprite, sprites, backgrounds, appPayload, onCanvasChange, selectSprite]);

  const onDeleteBackground = useCallback(async () => {
    if (!selectedBackground) {
      return;
    }

    onCanvasChange?.({
      ...appPayload,
      sprites,
      backgrounds: backgrounds.filter(b => b._file !== selectedBackground._file),
    });
  }, [selectedBackground, onCanvasChange, sprites, appPayload, backgrounds]);

  return (
    <div className={classNames('flex flex-col !w-full gap-px', className)}>
      <Collapsible.Root
        className="!w-full"
        open={!isCollapsed('canvas.sprites')}
        onOpenChange={collapse.bind(null, 'canvas.sprites')}
      >
        <Collapsible.Trigger>
          <Text>Sprites</Text>
        </Collapsible.Trigger>
        <Collapsible.Content>
          { sprites.length === 0 ? (
            <Text
              size="1"
              className="block text-center text-slate pb-3"
            >
              No sprites available.
            </Text>
          ) : sprites.map(sprite => (
            <ContextMenu.Root
              key={sprite._file}
              onOpenChange={selectSprite?.bind(null, sprite)}
            >
              <ContextMenu.Trigger>
                <a
                  key={sprite._file}
                  href="#"
                  className={classNames(
                    'flex items-center gap-2 px-3 py-1',
                    { 'bg-(--accent-9)':
                      selectedSprite === sprite },
                  )}
                  onClick={selectSprite?.bind(null, sprite)}
                >
                  <ImageIcon
                    className={classNames(
                      '[&_path]:fill-(--accent-9)',
                      { '[&_path]:fill-seashell':
                        selectedSprite === sprite },
                    )}
                  />
                  <Text>{ sprite.name || 'Untitled' }</Text>
                </a>
              </ContextMenu.Trigger>
              <ContextMenu.Content>
                <ContextMenu.Item
                  shortcut={window.electron.isDarwin ? '⌦' : 'Del'}
                  onClick={onDeleteSprite}
                >
                  Delete
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Root>
          )) }
        </Collapsible.Content>
      </Collapsible.Root>
      <Collapsible.Root
        className="!w-full"
        open={!isCollapsed('canvas.backgrounds')}
        onOpenChange={collapse.bind(null, 'canvas.backgrounds')}
      >
        <Collapsible.Trigger>
          <Text>Backgrounds</Text>
        </Collapsible.Trigger>
        <Collapsible.Content>
          { backgrounds.length === 0 ? (
            <Text
              size="1"
              className="block text-center text-slate pb-3"
            >
              No backgrounds available.
            </Text>
          ) : backgrounds.map(background => (
            <ContextMenu.Root
              key={background._file}
              onOpenChange={selectBackground?.bind(null, background)}
            >
              <ContextMenu.Trigger>
                <a
                  key={background._file}
                  href="#"
                  className={classNames(
                    'flex items-center gap-2 px-3 py-1',
                    { 'bg-(--accent-9)':
                      selectedBackground === background },
                  )}
                  onClick={selectBackground?.bind(null, background)}
                >
                  <ImageIcon
                    className={classNames(
                      '[&_path]:fill-(--accent-9)',
                      { '[&_path]:fill-seashell':
                        selectedBackground === background },
                    )}
                  />
                  <Text>{ background.name || 'Untitled' }</Text>
                </a>
              </ContextMenu.Trigger>
              <ContextMenu.Content>
                <ContextMenu.Item
                  shortcut={window.electron.isDarwin ? '⌦' : 'Del'}
                  onClick={onDeleteBackground}
                >
                  Delete
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Root>
          )) }
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
};

export default LeftSidebar;

