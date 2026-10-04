import { useCallback, useReducer, useState, type ChangeEvent } from 'react';
import { set } from '@junipero/react';
import { Select, Text, TextField } from '@radix-ui/themes';

import type {
  SetVariableEvent,
} from '../../../types';
import { useDelayedCallback } from '../../services/hooks';
import VariablesListField from '../VariablesListField';

export interface EventSetVariableProps {
  event: SetVariableEvent;
  onValueChange?: (
    event: SetVariableEvent,
  ) => void;
}

const EventSetVariable = ({
  event: eventProp,
  onValueChange,
}: EventSetVariableProps) => {
  const [event, setEvent] = useState(eventProp);
  // Performance optimizations
  const onDelayedValueChange = useDelayedCallback(onValueChange, 300);

  const onChange = useCallback((
    name: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    set(event, name, e.target.value);
    setEvent(event);
    onDelayedValueChange?.(event);
  }, [event, onDelayedValueChange]);

  const onValueChange_ = useCallback((name: string, val: any) => {
    set(event, name, val);
    setEvent(event);
    onDelayedValueChange?.(event);
  }, [event, onDelayedValueChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Variable</Text>
        <VariablesListField
          value={event.name}
          onValueChange={onValueChange_.bind(null, 'name')}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Operation</Text>
        <Select.Root
          value={event.operation || 'set'}
          onValueChange={onValueChange_.bind(null, 'operation')}
        >
          <Select.Trigger />
          <Select.Content>
            <Select.Item value="set">Set</Select.Item>
            <Select.Item value="increment">Increment</Select.Item>
            <Select.Item value="decrement">Decrement</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">
          { (event.operation || 'set') === 'set' ? 'Value' : 'Amount' }
        </Text>
        <TextField.Root
          type={(event.operation || 'set') === 'set' ? 'text' : 'number'}
          placeholder={(event.operation || 'set') === 'set' ? undefined : '1'}
          // TODO: handle dynamic EventValue, in the future, one day
          value={event.value as string}
          onChange={onChange.bind(null, 'value')}
        />
      </div>
    </div>
  );
};

export default EventSetVariable;
