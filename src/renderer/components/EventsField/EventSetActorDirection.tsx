import { useCallback } from 'react';
import { set } from '@junipero/react';
import { Select, Text } from '@radix-ui/themes';

import type {
  SetActorDirectionEvent,
} from '../../../types';
import DirectionField from '../DirectionField';
import { useSceneForm } from '../../services/hooks';

export interface EventSetActorDirectionProps {
  event: SetActorDirectionEvent;
  onValueChange?: (
    event: SetActorDirectionEvent,
  ) => void;
}

const EventSetActorDirection = ({
  event,
  onValueChange,
}: EventSetActorDirectionProps) => {
  const { scene } = useSceneForm();
  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  }, [onValueChange, event]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Actor</Text>
        <Select.Root
          value={event.actor || ''}
          onValueChange={onValueChange_.bind(null, 'actor')}
        >
          <Select.Trigger placeholder="Select" />
          <Select.Content>
            { scene?.actors?.map(actor => (
              <Select.Item key={actor.id} value={actor.id}>
                { actor.name }
              </Select.Item>
            )) }
          </Select.Content>
        </Select.Root>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Direction</Text>
        <DirectionField
          value={event.direction ?? 'down'}
          onValueChange={onValueChange_.bind(null, 'direction')}
        />
      </div>
    </div>
  );
};

export default EventSetActorDirection;
