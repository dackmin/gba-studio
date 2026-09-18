import { type DragEvent, useCallback } from 'react';
import { type CardProps, Card, Inset } from '@radix-ui/themes';
import { type DraggingPositionType, Droppable, set, classNames } from '@junipero/react';

import type { ParallelEventsEvent, SceneEvent } from '../../../types';
import { isParallelizable } from '../../services/events';
import { useDraggable } from '../../services/hooks';
import EventsField from '.';

export interface EventParallelProps {
  event: ParallelEventsEvent;
  onValueChange?: (event: ParallelEventsEvent) => void;
  onDrop?: (
    container: SceneEvent[] | undefined,
    target: SceneEvent,
    data: SceneEvent,
    position: DraggingPositionType,
    e: DragEvent<HTMLDivElement>,
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

  const onDrop_ = useCallback((
    container: SceneEvent[] | undefined,
    target: SceneEvent,
    data: SceneEvent,
    position: DraggingPositionType,
    e: DragEvent<HTMLDivElement>,
  ) => {
    if (!isParallelizable(data.type)) {
      return;
    }

    onDrop?.(container, target, data, position, e);
  }, [onDrop]);

  const onInnerDrop = useCallback((
    container: SceneEvent[] | undefined,
    _innerContainer: SceneEvent[] | undefined,
    target: SceneEvent,
    data: SceneEvent,
    position: DraggingPositionType,
    e: DragEvent<HTMLDivElement>,
  ) => {
    if (!isParallelizable(data.type)) {
      return;
    }

    onDrop?.(container, target, data, position, e);
  }, [onDrop]);

  return (
    <div className="flex flex-col gap-2">
      <EventParallelDroppable event={event} onDrop={onDrop_.bind(null, event.events, event)}>
        <Inset>
          <EventsField
            value={event.events ?? []}
            zone="events"
            filter={item => !!item.parallelizable}
            onValueChange={onValueChange_.bind(null, 'events')}
            onDrop={onInnerDrop.bind(null, event.events)}
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
  const { data } = useDraggable<SceneEvent>();

  return (
    <Droppable onDrop={onDrop} disabled={event.events?.length > 0}>
      <Card
        className={classNames({
          ['drag-enter:outline-2 drag-enter:outline-dashed drag-enter:outline-blue-500']:
            event.events?.length === 0 && isParallelizable(data?.type || ''),
        })}
      >
        { children }
      </Card>
    </Droppable>
  );
};

export default EventParallel;
