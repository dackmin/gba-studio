import { useCallback } from 'react';
import { set } from '@junipero/react';
import { Select, Text } from '@radix-ui/themes';

import type {
  DisableSpriteEvent,
  EnableSpriteEvent,
} from '../../../types';
import { useCanvas } from '../../services/hooks';

export interface EventSpriteProps {
  event: EnableSpriteEvent | DisableSpriteEvent;
  onValueChange?: (
    event: EnableSpriteEvent | DisableSpriteEvent,
  ) => void;
}

const EventSprite = ({
  event,
  onValueChange,
}: EventSpriteProps) => {
  const { selectedScene, selectedItem } = useCanvas();

  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  }, [onValueChange, event]);

  return (
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
  );
};

export default EventSprite;
