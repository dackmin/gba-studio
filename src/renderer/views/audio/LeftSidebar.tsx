import { type ComponentPropsWithoutRef, useCallback } from 'react';
import { classNames } from '@junipero/react';
import { ContextMenu, Text } from '@radix-ui/themes';
import { SpeakerLoudIcon } from '@radix-ui/react-icons';

import { useApp, useAudio, useLocalData } from '../../services/hooks';
import Collapsible from '../../components/Collapsible';

export interface LeftSidebarProps extends ComponentPropsWithoutRef<'div'> {}

const LeftSidebar = ({
  className,
}: LeftSidebarProps) => {
  const { collapse, isCollapsed } = useLocalData();
  const { sounds, music, onCanvasChange, ...appPayload } = useApp();
  const { selectedSound, selectedMusic, selectSound, selectMusic } = useAudio();

  const onDeleteSound = useCallback(async () => {
    if (!selectedSound) {
      return;
    }

    const updatedSounds = sounds.filter(s => s._file !== selectedSound._file);
    onCanvasChange?.({
      ...appPayload,
      sounds: updatedSounds,
    });
    selectSound?.(updatedSounds[0]);
  }, [selectedSound, sounds, appPayload, selectSound, onCanvasChange]);

  const onDeleteMusic = useCallback(async () => {
    if (!selectedMusic) {
      return;
    }

    const updatedMusic = music.filter(m => m._file !== selectedMusic._file);
    onCanvasChange?.({
      ...appPayload,
      music: updatedMusic,
    });
    selectMusic?.(updatedMusic[0]);
  }, [selectedMusic, music, appPayload, selectMusic, onCanvasChange]);

  return (
    <div className={classNames('flex flex-col !w-full gap-px', className)}>
      <Collapsible.Root
        className="!w-full"
        open={!isCollapsed('canvas.sounds')}
        onOpenChange={collapse.bind(null, 'canvas.sounds')}
      >
        <Collapsible.Trigger>
          <Text>Sounds</Text>
        </Collapsible.Trigger>
        <Collapsible.Content>
          { sounds.length === 0 ? (
            <Text
              size="1"
              className="block text-center text-slate pb-3"
            >
              No sounds available.
            </Text>
          ) : sounds.map(sound => (
            <ContextMenu.Root
              key={sound.id}
              onOpenChange={selectSound?.bind(null, sound)}
            >
              <ContextMenu.Trigger>
                <a
                  href="#"
                  className={classNames(
                    'flex items-center gap-2 px-3 py-1',
                    { 'bg-(--accent-9)': selectedSound === sound },
                  )}
                  onClick={selectSound?.bind(null, sound)}
                >
                  <SpeakerLoudIcon
                    className={classNames(
                      '[&_path]:fill-(--accent-9)',
                      { '[&_path]:fill-seashell':
                        selectedSound === sound },
                    )}
                  />
                  <Text>{ sound.name || 'Untitled' }</Text>
                </a>
              </ContextMenu.Trigger>
              <ContextMenu.Content>
                <ContextMenu.Item
                  shortcut={window.electron.isDarwin ? '⌦' : 'Del'}
                  onClick={onDeleteSound}
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
        open={!isCollapsed('canvas.music')}
        onOpenChange={collapse.bind(null, 'canvas.music')}
      >
        <Collapsible.Trigger>
          <Text>Music</Text>
        </Collapsible.Trigger>
        <Collapsible.Content>
          { music.length === 0 ? (
            <Text
              size="1"
              className="block text-center text-slate pb-3"
            >
              No music available.
            </Text>
          ) : music.map(musicFile => (
            <ContextMenu.Root
              key={musicFile.id}
              onOpenChange={selectMusic?.bind(null, musicFile)}
            >
              <ContextMenu.Trigger>
                <a
                  href="#"
                  className={classNames(
                    'flex items-center gap-2 px-3 py-1',
                    { 'bg-(--accent-9)': selectedMusic === musicFile },
                  )}
                  onClick={selectMusic?.bind(null, musicFile)}
                >
                  <SpeakerLoudIcon
                    className={classNames(
                      '[&_path]:fill-(--accent-9)',
                      { '[&_path]:fill-seashell':
                        selectedMusic === musicFile },
                    )}
                  />
                  <Text>{ musicFile.name || 'Untitled' }</Text>
                </a>
              </ContextMenu.Trigger>
              <ContextMenu.Content>
                <ContextMenu.Item
                  shortcut={window.electron.isDarwin ? '⌦' : 'Del'}
                  onClick={onDeleteMusic}
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
