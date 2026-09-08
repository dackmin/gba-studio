import { useCallback } from 'react';
import { set } from '@junipero/react';
import { Select, Switch, Text, TextField } from '@radix-ui/themes';

import type { FollowActorEvent } from '../../../types';
import { useSceneForm } from '../../services/hooks';
import EventValueField from '../EventValueField';

export interface EventFollowActorProps {
  event: FollowActorEvent;
  onValueChange?: (
    event: FollowActorEvent,
  ) => void;
}

const EventFollowActor = ({
  event,
  onValueChange,
}: EventFollowActorProps) => {
  const { scene } = useSceneForm();

  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  }, [event, onValueChange]);

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
        <Text size="1" className="text-slate">Duration</Text>
        <EventValueField
          type="number"
          value={event.duration}
          onValueChange={onValueChange_.bind(null, 'duration')}
        >
          <TextField.Slot side="right">ms</TextField.Slot>
        </EventValueField>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Allow Diagonal</Text>
        <Switch
          checked={!!event.allowDiagonal}
          onCheckedChange={onValueChange_.bind(null, 'allowDiagonal')}
        />
      </div>
      { !event.allowDiagonal && (
        <div className="flex flex-col gap-2">
          <Text size="1" className="text-slate">Direction Priority</Text>
          <Select.Root
            value={event.directionPriority || 'horizontal'}
            onValueChange={onValueChange_.bind(null, 'directionPriority')}
          >
            <Select.Trigger placeholder="Select" />
            <Select.Content>
              <Select.Item value="horizontal">Horizontal</Select.Item>
              <Select.Item value="vertical">Vertical</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>
      ) }
    </div>
  );
};

export default EventFollowActor;
