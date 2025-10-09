import { useMemo } from 'react';
import { Card, Inset, Select, Text } from '@radix-ui/themes';
import { set } from '@junipero/react';

import type { EventValue, IfEvent, IfEventCondition } from '../../../types';
import EventValueField from '../EventValueField';
import EventsField from '.';

export interface EventIfProps {
  event: IfEvent;
  onValueChange?: (event: IfEvent) => void;
}

const EventIf = ({
  event: eventProp,
  onValueChange,
}: EventIfProps) => {
  const event = useMemo(() => ({
    ...eventProp,
    conditions: eventProp.conditions?.length ? eventProp.conditions : [{
      type: 'condition', left: '', operator: 'eq', right: '',
    } as IfEventCondition],
  }), [eventProp]);

  const onConditionChange = (condition: IfEventCondition) => {
    set(event, 'conditions',
      event.conditions.map(c => c === condition ? condition : c));
    onValueChange?.(event);
  };

  const onValueChange_ = (name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Condition</Text>
        <Card className="!flex flex-col gap-1">
          { event.conditions.map((condition, index) => (
            <EventIfCondition
              key={index}
              condition={condition}
              onValueChange={onConditionChange}
            />
          )) }
        </Card>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Then</Text>
        <Card>
          <Inset>
            <EventsField
              value={event.then ?? []}
              onValueChange={onValueChange_.bind(null, 'then')}
            />
          </Inset>
        </Card>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Else</Text>
        <Card>
          <Inset>
            <EventsField
              value={event.else ?? []}
              onValueChange={onValueChange_.bind(null, 'else')}
            />
          </Inset>
        </Card>
      </div>
    </div>
  );
};

export interface EventIfConditionProps {
  condition: IfEventCondition;
  onValueChange?: (condition: IfEventCondition) => void;
}

const EventIfCondition = ({
  condition,
  onValueChange,
}: EventIfConditionProps) => {
  const onConditionValueChange = (name: string, value: EventValue | string) => {
    set(condition, name, value);
    onValueChange?.(condition);
  };

  return (
    <div className="flex items-center gap-2">
      { (condition.left as IfEventCondition).type !== 'condition' && (
        <EventValueField
          type="text"
          className="!flex-auto"
          value={condition.left as EventValue}
          onValueChange={onConditionValueChange.bind(null, 'left')}
        />
      ) }
      <Select.Root
        size="1"
        value={condition.operator}
        onValueChange={onConditionValueChange.bind(null, 'operator')}
      >
        <Select.Trigger
          className="flex-none"
          placeholder="=="
          variant="ghost"
        />
        <Select.Content>
          <Select.Item value="==">==</Select.Item>
          <Select.Item value="!=">!=</Select.Item>
          <Select.Item value="&&">&&</Select.Item>
          <Select.Item value="||">||</Select.Item>
        </Select.Content>
      </Select.Root>
      { (condition.right as IfEventCondition).type !== 'condition' && (
        <EventValueField
          type="text"
          className="!flex-auto"
          value={condition.right as EventValue}
          onValueChange={onConditionValueChange.bind(null, 'right')}
        />
      ) }
    </div>
  );
};

export default EventIf;
