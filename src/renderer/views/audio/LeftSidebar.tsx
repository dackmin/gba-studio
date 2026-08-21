import { type ComponentPropsWithoutRef, useRef } from 'react';
import { classNames } from '@junipero/react';
import { ContextMenu, Text } from '@radix-ui/themes';
import { SpeakerLoudIcon } from '@radix-ui/react-icons';

import { useApp, useAudio, useLocalData } from '../../services/hooks';
import { DeleteModalRef } from '../../components/DeleteModal';
import Collapsible from '../../components/Collapsible';

export interface LeftSidebarProps extends ComponentPropsWithoutRef<'div'> {}

const LeftSidebar = ({
  className,
}: LeftSidebarProps) => {
  const deleteSoundModalRef = useRef<DeleteModalRef>(null);
  const deleteMusicModalRef = useRef<DeleteModalRef>(null);
  const { collapse, isCollapsed } = useLocalData();
  const { sounds, music } = useApp();
  const { selectedSound, selectedMusic, selectSound, selectMusic } = useAudio();

  const onOpenDeleteSoundModal = () => {
    deleteSoundModalRef.current?.open();
  };

  const onOpenDeleteMusicModal = () => {
    deleteMusicModalRef.current?.open();
  };

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
              key={sound._file}
              onOpenChange={selectSound?.bind(null, sound)}
            >
              <ContextMenu.Trigger>
                <a
                  key={sound._file}
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
                  onClick={onOpenDeleteSoundModal}
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
              key={musicFile._file}
              onOpenChange={selectMusic?.bind(null, musicFile)}
            >
              <ContextMenu.Trigger>
                <a
                  key={musicFile._file}
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
                  onClick={onOpenDeleteMusicModal}
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
