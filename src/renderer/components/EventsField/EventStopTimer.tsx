import { type ChangeEvent, useCallback } from 'react';
import { set } from '@junipero/react';
import { Text, TextField } from '@radix-ui/themes';

import type { StopTimerEvent } from '../../../types';
import { useDelayedCallback } from '../../services/hooks';

export interface EventStopTimerProps {
  event: StopTimerEvent;
  onValueChange?: (event: StopTimerEvent) => void;
}

const EventStopTimer = ({
  event,
  onValueChange,
}: EventStopTimerProps) => {
  const onDelayedValueChange = useDelayedCallback(onValueChange, 300);

  const onTextChange_ = useCallback((name: string, e: ChangeEvent<HTMLInputElement>) => {
    set(event, name, e.target.value);
    onDelayedValueChange?.(event);
  }, [event, onDelayedValueChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Timer ID</Text>
        <TextField.Root
          defaultValue={event.timerId ?? ''}
          onChange={onTextChange_.bind(null, 'timerId')}
        />
      </div>
    </div>
  );
};

export default EventStopTimer;
