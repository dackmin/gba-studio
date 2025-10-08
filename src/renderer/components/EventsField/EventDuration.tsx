import { useCallback, useState } from 'react';
import { set } from '@junipero/react';
import { Text, TextField } from '@radix-ui/themes';

import type {
  EventValue,
  FadeInEvent,
  FadeOutEvent,
  WaitEvent,
} from '../../../types';
import { useDelayedCallback } from '../../services/hooks';
import EventValueField from '../EventValueField';

export interface EventDurationProps {
  event: WaitEvent | FadeInEvent | FadeOutEvent;
  onValueChange?: (
    event: WaitEvent | FadeInEvent | FadeOutEvent,
  ) => void;
}

const EventDuration = ({
  event: eventProp,
  onValueChange,
}: EventDurationProps) => {
  const [event, setEvent] = useState(eventProp);
  const onDelayedValueChange = useDelayedCallback(onValueChange, 300);

  const onDurationChange = useCallback((value: EventValue) => {
    set(event, 'duration', value);
    setEvent(event);
    onDelayedValueChange?.(event);
  }, [event, onDelayedValueChange]);

  return (
    <div className="flex flex-col gap-2">
      <Text size="1" className="text-slate">Duration</Text>
      <EventValueField
        type="number"
        value={event.duration}
        onValueChange={onDurationChange}
        min={0}
      >
        <TextField.Slot side="right">ms</TextField.Slot>
      </EventValueField>
    </div>
  );
};

export default EventDuration;
