import { useCallback } from 'react';
import { set } from '@junipero/react';
import { Text } from '@radix-ui/themes';

import type {
  DisableActorEvent,
  EnableActorEvent,
} from '../../../types';
import ActorListField from '../ActorListField';

export interface EventActorProps {
  event: EnableActorEvent | DisableActorEvent;
  onValueChange?: (
    event: EnableActorEvent | DisableActorEvent,
  ) => void;
}

const EventActor = ({
  event,
  onValueChange,
}: EventActorProps) => {
  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  }, [onValueChange, event]);

  return (
    <div className="flex flex-col gap-2">
      <Text size="1" className="text-slate">Actor</Text>
      <ActorListField
        value={event.actor || ''}
        onValueChange={onValueChange_.bind(null, 'actor')}
      />
    </div>
  );
};

export default EventActor;
