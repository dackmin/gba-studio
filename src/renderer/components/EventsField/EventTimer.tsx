import { type ChangeEvent, useCallback } from 'react';
import { Card, Inset, Text, TextField, Tooltip } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { set } from '@junipero/react';

import type { RunAfterEvent, RunEveryEvent } from '../../../types';
import { isNotHandler } from '../../services/events';
import { useDelayedCallback } from '../../services/hooks';
import Collapsible from '../Collapsible';
import EventValueField, {
  EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES,
} from '../EventValueField';
import EventsField from '.';

export interface EventTimerProps {
  event: RunAfterEvent | RunEveryEvent;
  onValueChange?: (event: RunAfterEvent | RunEveryEvent) => void;
}

const EventTimer = ({
  event,
  onValueChange,
}: EventTimerProps) => {
  const onDelayedValueChange = useDelayedCallback(onValueChange, 300);

  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  }, [onValueChange, event]);

  const onTextChange_ = useCallback((name: string, e: ChangeEvent<HTMLInputElement>) => {
    set(event, name, e.target.value);
    onDelayedValueChange?.(event);
  }, [event, onDelayedValueChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">
          { event.type === 'run-every' ? 'Interval' : 'Delay' }
        </Text>
        <EventValueField
          excludeTypes={EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES}
          value={event.duration ?? 1000}
          onValueChange={onValueChange_.bind(null, 'duration')}
        >
          <TextField.Slot side="right">ms</TextField.Slot>
        </EventValueField>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Events</Text>
        <Card>
          <Inset>
            <EventsField
              value={event.events ?? []}
              filter={isNotHandler}
              onValueChange={onValueChange_.bind(null, 'events')}
            />
          </Inset>
        </Card>
      </div>
      <div className="flex flex-col gap-2">
        <Collapsible.Root>
          <Collapsible.Trigger className="px-0! py-0! text-sm! text-slate">
            Advanced
          </Collapsible.Trigger>
          <Collapsible.Content className="mt-4! flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <Text size="1" className="text-slate">Timer ID</Text>
                <Tooltip
                  content={
                    'Useful to stop this timer with a Stop Timer event. Events with the same ID ' +
                    'will all be stopped at once.'
                  }
                >
                  <InfoCircledIcon
                    width={12}
                    height={12}
                    className="[&_path]:fill-(--accent-9)"
                  />
                </Tooltip>
              </div>
              <TextField.Root
                defaultValue={event.timerId ?? ''}
                onChange={onTextChange_.bind(null, 'timerId')}
              />
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      </div>
    </div>
  );
};

export default EventTimer;
