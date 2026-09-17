import { type DragEvent, useMemo } from 'react';
import { type CardProps, Card, Inset, Select, Text } from '@radix-ui/themes';
import { type DraggingPositionType, Droppable, classNames, set } from '@junipero/react';

import type { EventValue, IfEvent, IfEventCondition, SceneEvent } from '../../../types';
import EventValueField from '../EventValueField';
import EventsField from '.';

export interface EventIfProps {
  event: IfEvent;
  onValueChange?: (event: IfEvent) => void;
  onDrop?: (
    containerPath: string | undefined,
    data: SceneEvent,
    position: DraggingPositionType,
  ) => void;
}

const EventIf = ({
  event: eventProp,
  onValueChange,
  onDrop,
}: EventIfProps) => {
  const event = useMemo(() => ({
    ...eventProp,
    conditions: eventProp.conditions?.length ? eventProp.conditions : [{
      type: 'condition', left: '', operator: '==', right: '',
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

  const onDrop_ = (
    containerPath: string | undefined,
    data: SceneEvent,
    position: DraggingPositionType,
    e: DragEvent<HTMLDivElement>
  ) => {
    onDrop?.(containerPath, data, position);
    e.stopPropagation();
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
        <EventIfDroppable
          event={event}
          zone="then"
          onDrop={onDrop_?.bind(null, 'then')}
        >
          <Inset>
            <EventsField
              value={event.then ?? []}
              zone="then"
              onValueChange={onValueChange_.bind(null, 'then')}
            />
          </Inset>
        </EventIfDroppable>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Else</Text>
        <EventIfDroppable
          event={event}
          zone="else"
          onDrop={onDrop_?.bind(null, 'else')}
        >
          <Inset>
            <EventsField
              value={event.else ?? []}
              zone="else"
              onValueChange={onValueChange_.bind(null, 'else')}
            />
          </Inset>
        </EventIfDroppable>
      </div>
    </div>
  );
};

export interface EventIfConditionProps {
  condition: IfEventCondition;
  onValueChange?: (condition: IfEventCondition) => void;
}

const isLogicalOperator = (operator?: string) => operator === '&&' || operator === '||';

const EventIfCondition = ({
  condition,
  onValueChange,
}: EventIfConditionProps) => {
  const isLogical = isLogicalOperator(condition.operator);

  const onConditionValueChange = (name: string, value: EventValue | string) => {
    set(condition, name, value);
    onValueChange?.(condition);
  };

  const onOperatorChange = (operator: string) => {
    const wasLogical = isLogicalOperator(condition.operator);
    const willBeLogical = isLogicalOperator(operator);

    set(condition, 'operator', operator);

    // Switching to/from &&/|| swaps operands between plain values and subconditions
    if (willBeLogical && !wasLogical) {
      set(condition, 'left', { type: 'condition', left: '', operator: '==', right: '' });
      set(condition, 'right', { type: 'condition', left: '', operator: '==', right: '' });
    } else if (!willBeLogical && wasLogical) {
      set(condition, 'left', '');
      set(condition, 'right', '');
    }

    onValueChange?.(condition);
  };

  const onSubConditionChange = (name: 'left' | 'right', subCondition: IfEventCondition) => {
    set(condition, name, subCondition);
    onValueChange?.(condition);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        { !isLogical && (
          <EventValueField
            type="text"
            className="!flex-auto"
            value={condition.left as EventValue}
            onValueChange={onConditionValueChange.bind(null, 'left')}
          />
        ) }
        <Select.Root
          size="1"
          value={condition.operator ?? '=='}
          onValueChange={onOperatorChange}
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
        { !isLogical && (
          <EventValueField
            type="text"
            className="!flex-auto"
            value={condition.right as EventValue}
            onValueChange={onConditionValueChange.bind(null, 'right')}
          />
        ) }
      </div>
      { isLogical && (
        <div className="flex flex-col gap-2 pl-4 border-l-2 border-slate-6">
          <EventIfCondition
            condition={condition.left as IfEventCondition}
            onValueChange={onSubConditionChange.bind(null, 'left')}
          />
          <EventIfCondition
            condition={condition.right as IfEventCondition}
            onValueChange={onSubConditionChange.bind(null, 'right')}
          />
        </div>
      ) }
    </div>
  );
};

export interface EventIfDroppableProps extends Omit<CardProps, 'onDrop'> {
  event: IfEvent;
  zone: 'then' | 'else';
  onDrop?: (
    data: SceneEvent,
    position: DraggingPositionType,
    e: DragEvent<HTMLDivElement>
  ) => void;
}

const EventIfDroppable = ({
  event,
  zone,
  children,
  onDrop,
}: EventIfDroppableProps) => {
  return (
    <Droppable onDrop={onDrop} disabled={(event[zone]?.length || 0) > 0}>
      <Card
        className={classNames({
          ['drag-enter:outline-2 drag-enter:outline-dashed drag-enter:outline-blue-500']:
            event[zone]?.length === 0,
        })}
      >
        { children }
      </Card>
    </Droppable>
  );
};

export default EventIf;
