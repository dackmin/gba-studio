import { Card, Inset, Text } from '@radix-ui/themes';
import { set } from '@junipero/react';

import type { OnOutOfCameraBoundsEvent } from '../../../types';
import type { EventDefinition } from '../../services/events';
import EventsField from '.';

const isNotHandler = (definition: EventDefinition) =>
  !definition.value.startsWith('on-');

export interface EventOutOfCameraBoundsProps {
  event: OnOutOfCameraBoundsEvent;
  onValueChange?: (event: OnOutOfCameraBoundsEvent) => void;
}

const EventOutOfCameraBounds = ({
  event,
  onValueChange,
}: EventOutOfCameraBoundsProps) => {
  const onEventsChange = (events: OnOutOfCameraBoundsEvent['events']) => {
    set(event, 'events', events);
    onValueChange?.(event);
  };

  return (
    <div className="flex flex-col gap-2">
      <Text size="1" className="text-slate">Events</Text>
      <Card>
        <Inset>
          <EventsField
            value={event.events ?? []}
            filter={isNotHandler}
            onValueChange={onEventsChange}
          />
        </Inset>
      </Card>
    </div>
  );
};

export default EventOutOfCameraBounds;
