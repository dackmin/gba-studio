import { useCallback } from 'react';
import { set } from '@junipero/react';
import { Text } from '@radix-ui/themes';

import type {
  SetActorDirectionEvent,
} from '../../../types';
import DirectionField from '../DirectionField';
import ActorListField from '../ActorListField';

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
  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  }, [onValueChange, event]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Actor</Text>
        <ActorListField
          value={event.actor || ''}
          onValueChange={onValueChange_.bind(null, 'actor')}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Direction</Text>
        <DirectionField
          exclude={['up_left', 'up_right', 'down_left', 'down_right']}
          value={event.direction ?? 'down'}
          onValueChange={onValueChange_.bind(null, 'direction')}
        />
      </div>
    </div>
  );
};

export default EventSetActorDirection;
