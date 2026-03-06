import {
  type ComponentPropsWithoutRef,
  type MouseEvent,
  useCallback,
  useMemo,
  useReducer,
} from 'react';
import { classNames, mockState } from '@junipero/react';
import { IconButton, Text, ContextMenu } from '@radix-ui/themes';
import { PlusCircledIcon, ImageIcon, LayersIcon } from '@radix-ui/react-icons';
import { v4 as uuid } from 'uuid';

import Collapsible from '../../components/Collapsible';
import { useApp, useSprite } from '../../services/hooks';
import { getGraphicName } from '../../../helpers';
import { GameSpriteFile } from '../../../types';

export interface LeftSidebarProps extends ComponentPropsWithoutRef<'div'> {
  selectedSprite?: GameSpriteFile;
  onSelectSprite?: (spriteFile: GameSpriteFile) => void;
}

export interface LeftSidebarState {

}

const LeftSidebar = ({
  className,
}: LeftSidebarProps) => {
  const { sprites, animations } = useApp();
  const {
    selectedSprite,
    selectSprite,
    selectedAnimation,
    selectAnimation,
    onAnimationsChange,
  } = useSprite();
  const [state, dispatch] = useReducer(mockState<LeftSidebarState>, {
  });

  const spriteAnimations = useMemo(() => (
    animations.filter(a => (
      a?._sprite_file === selectedSprite?._file
    ))
  ), [animations, selectedSprite]);

  const onAddAnimation = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (!selectedSprite) {
      return;
    }

    if (!animations.length) {
      animations.push({
        _sprite_file: selectedSprite._file,
        _file: `${selectedSprite?._file}.animations.json`,
        type: 'animations',
        id: uuid(),
        states: [],
      });
    }

    const latestRegistry = animations[animations.length - 1];
    onAnimationsChange?.({
      ...latestRegistry,
      states: [
        ...latestRegistry.states,
        {
          id: uuid(),
          name: 'NewState',
          animationType: 'fixed',
          animations: [],
        },
      ],
    });
  }, [animations, onAnimationsChange, selectedSprite]);

  return (
    <div className={classNames('flex flex-col !w-full gap-px', className)}>
      <Collapsible.Root className="!w-full" defaultOpen>
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
                  <Text>{ getGraphicName(sprite._file) }</Text>
                </a>
              </ContextMenu.Trigger>
              <ContextMenu.Content>
                <ContextMenu.Item
                  shortcut={window.electron.isDarwin ? '⌦' : 'Del'}
                  onClick={() => {}}
                >
                  Delete
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Root>
          )) }
        </Collapsible.Content>
      </Collapsible.Root>

      <Collapsible.Root className="!w-full">
        <Collapsible.Trigger>
          <div className="flex items-center justify-between w-full">
            <Text>Animations</Text>
            <IconButton
              variant="ghost"
              radius="full"
              onClick={onAddAnimation}
              disabled={!selectedSprite}
            >
              <PlusCircledIcon
                width={16}
                height={16}
              />
            </IconButton>
          </div>
        </Collapsible.Trigger>
        <Collapsible.Content>
          { (spriteAnimations.length > 0 && selectedSprite) ? (
            spriteAnimations.map(a => (
              a.states.map(state => (
                <Collapsible.Root className="!w-full" key={state.id}>
                  <Collapsible.Trigger>
                    <div className="flex items-center justify-between w-full">
                      <Text>{ state.name }</Text>
                    </div>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    { state.animations.map(animation => (
                      <ContextMenu.Root
                        key={animation.id}
                        onOpenChange={selectAnimation?.bind(null, animation)}
                      >
                        <ContextMenu.Trigger>
                          <a
                            key={animation.id}
                            href="#"
                            className={classNames(
                              'flex items-center gap-2 px-3 py-1',
                              { 'bg-(--accent-9)':
                                selectedAnimation === animation },
                            )}
                            onClick={selectAnimation?.bind(null, animation)}
                          >
                            <LayersIcon
                              className={classNames(
                                '[&_path]:fill-(--accent-9)',
                                { '[&_path]:fill-seashell':
                                  selectedAnimation === animation },
                              )}
                            />
                            <Text>{ animation.stateName }</Text>
                          </a>
                        </ContextMenu.Trigger>
                        <ContextMenu.Content>
                          <ContextMenu.Item
                            shortcut={window.electron.isDarwin ? '⌦' : 'Del'}
                            onClick={() => {}}
                          >
                            Delete
                          </ContextMenu.Item>
                        </ContextMenu.Content>
                      </ContextMenu.Root>
                    )) }
                  </Collapsible.Content>
                </Collapsible.Root>
              ))
            ))
          ) : (
            <Text
              size="1"
              className="block text-center text-slate pb-3"
            >
              No animations.
            </Text>
          ) }
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
};

export default LeftSidebar;

