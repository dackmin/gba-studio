import { useCallback } from 'react';
import { set } from '@junipero/react';
import { Select, Text } from '@radix-ui/themes';

import type {
  DisableActorEvent,
  EnableActorEvent,
} from '../../../types';
import { useSceneForm } from '../../services/hooks';

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
  const { scene } = useSceneForm();

  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  }, [onValueChange, event]);

  return (
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
  );
};

export default EventActor;
