import { useCallback, useMemo } from 'react';
import { set } from '@junipero/react';
import { Select, Text } from '@radix-ui/themes';

import type { SetSpriteAnimationEvent } from '../../../types';
import { findSprite } from '../../../helpers';
import { useAssets, useCanvas } from '../../services/hooks';
import AnimationsListField from '../AnimationsListField';

export interface EventSetSpriteAnimationProps {
  event: SetSpriteAnimationEvent;
  onValueChange?: (
    event: SetSpriteAnimationEvent,
  ) => void;
}

const EventSetSpriteAnimation = ({
  event,
  onValueChange,
}: EventSetSpriteAnimationProps) => {
  const { sprites } = useAssets();
  const { selectedScene, selectedItem } = useCanvas();

  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  }, [onValueChange, event]);

  const sceneSprite = useMemo(() => (
    selectedScene?.sprites?.find(sprite => sprite.id === event?.sprite)
  ), [selectedScene, event?.sprite]);

  const sprite = useMemo(() => (
    findSprite(sprites, sceneSprite?.sprite)
  ), [sprites, sceneSprite?.sprite]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Sprite</Text>
        <Select.Root
          value={event.sprite || ''}
          onValueChange={onValueChange_.bind(null, 'sprite')}
        >
          <Select.Trigger placeholder="Select" />
          <Select.Content>
            { selectedScene?.sprites?.map(sprite => (
              <Select.Item key={sprite.id} value={sprite.id}>
                { sprite.name }
                { selectedItem?.type === 'sprite' && selectedItem?.id === sprite.id ? (
                  <Text size="1" className="text-slate"> (this sprite)</Text>
                ) : '' }
              </Select.Item>
            )) }
          </Select.Content>
        </Select.Root>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Animation</Text>
        <AnimationsListField
          sprite={sprite}
          value={event.animation || ''}
          onValueChange={onValueChange_.bind(null, 'animation')}
        />
      </div>
    </div>
  );
};

export default EventSetSpriteAnimation;
