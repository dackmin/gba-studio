import { useCallback } from 'react';
import { set } from '@junipero/react';
import { Text } from '@radix-ui/themes';

import type { StopActorAnimationEvent } from '../../../types';
import ActorListField from '../ActorListField';

export interface EventStopActorAnimationProps {
  event: StopActorAnimationEvent;
  onValueChange?: (
    event: StopActorAnimationEvent,
  ) => void;
}

const EventStopActorAnimation = ({
  event,
  onValueChange,
}: EventStopActorAnimationProps) => {
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
    </div>
  );
};

export default EventStopActorAnimation;
