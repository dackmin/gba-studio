import type { DragEvent } from 'react';
import { type CardProps, Card, Inset } from '@radix-ui/themes';
import { type DraggingPositionType, Droppable, set, classNames } from '@junipero/react';

import type { ParallelEventsEvent, SceneEvent } from '../../../types';
import { isParallelizable } from '../../services/events';
import EventsField from '.';

export interface EventParallelProps {
  event: ParallelEventsEvent;
  onValueChange?: (event: ParallelEventsEvent) => void;
  onDrop?: (
    containerPath: string | undefined,
    data: SceneEvent,
    position: DraggingPositionType,
  ) => void;
}

const EventParallel = ({
  event,
  onValueChange,
  onDrop,
}: EventParallelProps) => {
  const onValueChange_ = (name: string, value: SceneEvent[]) => {
    set(event, name, value);
    onValueChange?.(event);
  };

  const onDrop_ = (
    data: SceneEvent,
    position: DraggingPositionType,
    e: DragEvent<HTMLDivElement>
  ) => {
    e.stopPropagation();

    if (!isParallelizable(data.type)) {
      return;
    }

    onDrop?.('events', data, position);
  };

  return (
    <div className="flex flex-col gap-2">
      <EventParallelDroppable event={event} onDrop={onDrop_}>
        <Inset>
          <EventsField
            value={event.events ?? []}
            zone="events"
            filter={item => !!item.parallelizable}
            onValueChange={onValueChange_.bind(null, 'events')}
          />
        </Inset>
      </EventParallelDroppable>
    </div>
  );
};

export interface EventParallelDroppableProps extends Omit<CardProps, 'onDrop'> {
  event: ParallelEventsEvent;
  onDrop?: (
    data: SceneEvent,
    position: DraggingPositionType,
    e: DragEvent<HTMLDivElement>
  ) => void;
}

const EventParallelDroppable = ({
  event,
  children,
  onDrop,
}: EventParallelDroppableProps) => {
  return (
    <Droppable onDrop={onDrop} disabled={event.events?.length > 0}>
      <Card
        className={classNames({
          ['drag-enter:outline-2 drag-enter:outline-dashed drag-enter:outline-blue-500']:
            event.events?.length === 0,
        })}
      >
        { children }
      </Card>
    </Droppable>
  );
};

export default EventParallel;
