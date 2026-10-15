import { type ComponentPropsWithoutRef, MouseEvent, useCallback } from 'react';
import { classNames } from '@junipero/react';
import { Text, ContextMenu, IconButton } from '@radix-ui/themes';
import { ImageIcon, PlusCircledIcon, FontFamilyIcon } from '@radix-ui/react-icons';

import type { GameBackgroundFile, GameFontFile, GameSpriteFile } from '../../../types';
import { useApp, useLocalData, useSprite } from '../../services/hooks';
import Collapsible from '../../components/Collapsible';

export interface LeftSidebarProps extends ComponentPropsWithoutRef<'div'> {}

export interface LeftSidebarState {
  deleting: boolean;
  selected?: GameSpriteFile | GameBackgroundFile | GameFontFile;
}

const LeftSidebar = ({
  className,
}: LeftSidebarProps) => {
  const {
    sprites,
    backgrounds,
    fonts,
    eventEmitter,
    onCanvasChange,
    ...appPayload
  } = useApp();
  const { isSectionOpen, setSectionOpen } = useLocalData();
  const {
    selectedSprite, selectedBackground, selectedFont,
    selectSprite, selectBackground, selectFont,
  } = useSprite();

  const onAddSprite = useCallback(async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    window.electron.send('import-sprite');
  }, []);

  const onAddBackground = useCallback(async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    window.electron.send('import-background');
  }, []);

  const onAddFont = useCallback(async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    window.electron.send('import-font');
  }, []);

  const onDeleteSprite = useCallback(async () => {
    if (!selectedSprite) {
      return;
    }

    const updatedSprites = sprites.filter(s => s._file !== selectedSprite._file);
    onCanvasChange?.({
      ...appPayload,
      backgrounds,
      fonts,
      sprites: updatedSprites,
    });
    selectSprite?.(updatedSprites[0]);
  }, [
    selectedSprite, sprites, backgrounds, fonts, appPayload, onCanvasChange,
    selectSprite,
  ]);

  const onDeleteBackground = useCallback(async () => {
    if (!selectedBackground) {
      return;
    }

    onCanvasChange?.({
      ...appPayload,
      sprites,
      fonts,
      backgrounds: backgrounds.filter(b => b._file !== selectedBackground._file),
    });
  }, [selectedBackground, onCanvasChange, sprites, appPayload, backgrounds, fonts]);

  const onDeleteFont = useCallback(async () => {
    if (!selectedFont) {
      return;
    }

    const updatedFonts = fonts.filter(f => f._file !== selectedFont._file);
    onCanvasChange?.({
      ...appPayload,
      sprites,
      backgrounds,
      fonts: updatedFonts,
    });
    selectFont?.(updatedFonts[0]);
  }, [
    selectedFont, onCanvasChange, sprites, appPayload, backgrounds, fonts,
    selectFont,
  ]);

  const onSelectSprite = useCallback((sprite: GameSpriteFile) => {
    selectSprite?.(sprite);

    setTimeout(() => {
      eventEmitter?.emit('images:center', sprite);
    }, 100);
  }, [selectSprite, eventEmitter]);

  const onSelectBackground = useCallback((background: GameBackgroundFile) => {
    selectBackground?.(background);
    setTimeout(() => {
      eventEmitter?.emit('images:center', background);
    }, 100);
  }, [selectBackground, eventEmitter]);

  const onSelectFont = useCallback((font: GameFontFile) => {
    selectFont?.(font);

    setTimeout(() => {
      eventEmitter?.emit('images:center', font);
    }, 100);
  }, [selectFont, eventEmitter]);

  return (
    <div className={classNames('flex flex-col !w-full gap-px', className)}>
      <Collapsible.Root
        className="!w-full"
        open={isSectionOpen('canvas.sprites', sprites.length > 0)}
        onOpenChange={setSectionOpen.bind(null, 'canvas.sprites')}
      >
        <Collapsible.Trigger>
          <div className="flex items-center justify-between w-full">
            <Text>Sprites</Text>
            <IconButton
              variant="ghost"
              radius="full"
              onClick={onAddSprite}
            >
              <PlusCircledIcon
                width={16}
                height={16}
              />
            </IconButton>
          </div>
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
                  onClick={onSelectSprite.bind(null, sprite)}
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
        open={isSectionOpen('canvas.backgrounds', backgrounds.length > 0)}
        onOpenChange={setSectionOpen.bind(null, 'canvas.backgrounds')}
      >
        <Collapsible.Trigger>
          <div className="flex items-center justify-between w-full">
            <Text>Backgrounds</Text>
            <IconButton
              variant="ghost"
              radius="full"
              onClick={onAddBackground}
            >
              <PlusCircledIcon
                width={16}
                height={16}
              />
            </IconButton>
          </div>
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
                  onClick={onSelectBackground.bind(null, background)}
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
      <Collapsible.Root
        className="!w-full"
        open={isSectionOpen('canvas.fonts', fonts.length > 0)}
        onOpenChange={setSectionOpen.bind(null, 'canvas.fonts')}
      >
        <Collapsible.Trigger>
          <div className="flex items-center justify-between w-full">
            <Text>Fonts</Text>
            <IconButton
              variant="ghost"
              radius="full"
              onClick={onAddFont}
            >
              <PlusCircledIcon
                width={16}
                height={16}
              />
            </IconButton>
          </div>
        </Collapsible.Trigger>
        <Collapsible.Content>
          { fonts.length === 0 ? (
            <Text
              size="1"
              className="block text-center text-slate pb-3"
            >
              No fonts available.
            </Text>
          ) : fonts.map(font => (
            <ContextMenu.Root
              key={font._file}
              onOpenChange={selectFont?.bind(null, font)}
            >
              <ContextMenu.Trigger>
                <a
                  key={font._file}
                  href="#"
                  className={classNames(
                    'flex items-center gap-2 px-3 py-1',
                    { 'bg-(--accent-9)':
                      selectedFont === font },
                  )}
                  onClick={onSelectFont.bind(null, font)}
                >
                  <FontFamilyIcon
                    className={classNames(
                      '[&_path]:fill-(--accent-9)',
                      { '[&_path]:fill-seashell':
                        selectedFont === font },
                    )}
                  />
                  <Text>{ font.name || 'Untitled' }</Text>
                </a>
              </ContextMenu.Trigger>
              <ContextMenu.Content>
                <ContextMenu.Item
                  shortcut={window.electron.isDarwin ? '⌦' : 'Del'}
                  onClick={onDeleteFont}
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

