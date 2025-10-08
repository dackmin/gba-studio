import type { ChangeEvent } from 'react';
import { set } from '@junipero/react';
import { Text, TextField } from '@radix-ui/themes';

import type {
  SetVariableEvent,
} from '../../../types';
import VariablesListField from '../VariablesListField';

export interface EventSetVariableProps {
  event: SetVariableEvent;
  onValueChange?: (
    event: SetVariableEvent,
  ) => void;
}

const EventSetVariable = ({
  event,
  onValueChange,
}: EventSetVariableProps) => {
  const onChange = (name: string, e: ChangeEvent<HTMLInputElement>) => {
    set(event, name, e.target.value);
    onValueChange?.(event);
  };

  const onValueChange_ = (name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  };

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
        <Text size="1" className="text-slate">Value</Text>
        <TextField.Root
          type="text"
          // TODO: handle dynamic EventValue, in the future, one day
          value={event.value as string}
          onChange={onChange.bind(null, 'value')}
        />
      </div>
    </div>
  );
};

export default EventSetVariable;
