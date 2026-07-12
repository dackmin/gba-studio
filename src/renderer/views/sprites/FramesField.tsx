import { useCallback } from 'react';
import { Card, IconButton, Text } from '@radix-ui/themes'
import { classNames } from '@junipero/react';
import { PlusIcon } from '@radix-ui/react-icons';
import { v4 as uuid } from 'uuid';

import type { SpriteAnimationFrame } from '../../../types'
import { useSprite } from '../../services/hooks';
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

  const onAddFrame = useCallback(() => {
    const newFrame: SpriteAnimationFrame = {
      type: 'frame',
      id: uuid(),
      index: 0,
      duration: 100,
    };

    onValueChange?.([
      ...(value || []),
      newFrame,
    ]);

    selectFrame?.(newFrame);
  }, [value, onValueChange, selectFrame]);
 
  return (
    <div className='flex items-center gap-2 overflow-x-auto py-2 px-3'>
      { JSON.stringify(value, null, 2) }
      { value?.map((frame, index) => (
        <Card
          key={frame.id || index}
          className={classNames(
            'w-16 h-16 !p-0 cursor-pointer',
            {
              'outline-2 outline-(--accent-9)':
                selectedFrame === frame,
            }
          )}
          onClick={selectFrame?.bind(null, frame)}
        >
          <Sprite
            sprite={selectedSprite}
            frame={frame.index}
            className='!w-full !h-full'
          />
        </Card>
      )) }
      <Card className='w-16 h-16 !p-0'>
        <IconButton
          variant='ghost'
          className='!w-full !h-full cursor-pointer'
          onClick={onAddFrame}
        >
          <PlusIcon />
        </IconButton>
      </Card>
    </div>
  )
};

export default FramesField;
