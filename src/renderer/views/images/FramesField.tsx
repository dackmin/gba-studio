import { useCallback } from 'react';
import { Card, ContextMenu, IconButton } from '@radix-ui/themes';
import { classNames } from '@junipero/react';
import { PlusIcon } from '@radix-ui/react-icons';
import { v4 as uuid } from 'uuid';

import type { SpriteAnimationFrame } from '../../../types';
import { usePlayback, useSprite } from '../../services/hooks';
import Sprite from '../../components/Sprite';

export interface FramesFieldProps {
  value?: SpriteAnimationFrame[];
  onValueChange?: (value: SpriteAnimationFrame[]) => void;
}

const FramesField = ({
  value,
  onValueChange,
}: FramesFieldProps) => {
  const { selectedSprite, selectedFrame, selectFrame } = useSprite();
  const { jumpTo } = usePlayback();

  const onSelectFrame = useCallback((frame: SpriteAnimationFrame) => {
    selectFrame?.(frame);
    jumpTo(value?.findIndex(f => f.id === frame.id) || 0);
  }, [selectFrame, jumpTo, value]);

  const onAddBefore = useCallback((frame: SpriteAnimationFrame) => {
    const newFrame: SpriteAnimationFrame = {
      type: 'frame',
      id: uuid(),
      index: 0,
      duration: 100,
    };

    const index = value?.findIndex(f => f.id === frame.id) || 0;
    onValueChange?.([
      ...(value?.slice(0, index) || []),
      newFrame,
      ...(value?.slice(index) || []),
    ]);

    onSelectFrame?.(newFrame);
  }, [value, onValueChange, onSelectFrame]);

  const onAddFrame = useCallback((frame?: SpriteAnimationFrame) => {
    const newFrame: SpriteAnimationFrame = {
      type: 'frame',
      id: uuid(),
      index: 0,
      duration: 100,
    };

    const index = frame
      ? (value?.findIndex(f => f.id === frame.id) || 0) + 1
      : (value?.length || 0);

    onValueChange?.([
      ...(value?.slice(0, index) || []),
      newFrame,
      ...(value?.slice(index) || []),
    ]);

    onSelectFrame?.(newFrame);
  }, [value, onValueChange, onSelectFrame]);

  const onDeleteFrame = useCallback((frame: SpriteAnimationFrame) => {
    onValueChange?.(value?.filter(f => f.id !== frame.id) || []);
  }, [value, onValueChange]);

  return (
    <div
      className={classNames(
        'flex items-center gap-2 overflow-x-auto py-2 px-3 overflow-x-scroll',
      )}
    >
      { value?.map(frame => (
        <ContextMenu.Root key={frame.id}>
          <ContextMenu.Trigger>
            <Card
              className={classNames(
                'w-16 h-16 !p-0 cursor-pointer',
                {
                  'outline-2 outline-(--accent-9)':
                    selectedFrame?.id === frame.id,
                }
              )}
              onClick={onSelectFrame.bind(null, frame)}
            >
              <Sprite
                sprite={selectedSprite}
                frame={frame}
                animated={false}
                className="!w-full !h-full"
              />
            </Card>
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item
              shortcut={(window.electron.isDarwin ? '⌘' : 'Ctrl') + '+B'}
              onClick={onAddBefore.bind(null, frame)}
            >
              Add Before
            </ContextMenu.Item>
            <ContextMenu.Item
              shortcut={(window.electron.isDarwin ? '⌘' : 'Ctrl') + '+N'}
              onClick={onAddFrame.bind(null, frame)}
            >
              Add After
            </ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item
              shortcut={window.electron.isDarwin ? '⌦' : 'Del'}
              onClick={onDeleteFrame.bind(null, frame)}
            >
              Delete
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
      )) }
      <Card className="w-16 h-16 aspect-square !p-0">
        <IconButton
          variant="ghost"
          className="!w-full !h-full cursor-pointer"
          onClick={onAddFrame?.bind(null, undefined)}
        >
          <PlusIcon />
        </IconButton>
      </Card>
    </div>
  );
};

export default FramesField;
