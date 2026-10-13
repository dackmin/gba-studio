import { Card, Inset, Text } from '@radix-ui/themes';
import { set } from '@junipero/react';

import type { OnVariableChangeEvent } from '../../../types';
import type { EventDefinition } from '../../services/events';
import VariablesListField from '../VariablesListField';
import EventsField from '.';

const isNotHandler = (definition: EventDefinition) =>
  !definition.value.startsWith('on-');

export interface EventVariableChangeProps {
  event: OnVariableChangeEvent;
  onValueChange?: (event: OnVariableChangeEvent) => void;
}

const EventVariableChange = ({
  event,
  onValueChange,
}: EventVariableChangeProps) => {
  const onValueChange_ = (name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Variable</Text>
        <VariablesListField
          value={event.variable}
          onValueChange={onValueChange_.bind(null, 'variable')}
        />
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
    </div>
  );
};

export default EventVariableChange;
