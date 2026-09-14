import { Card, type CardProps, Inset } from '@radix-ui/themes';
import { useDragOperation, useDroppable } from '@dnd-kit/react';
import { CollisionPriority } from '@dnd-kit/abstract';
import { set } from '@junipero/react';

import type { ParallelEventsEvent, SceneEvent } from '../../../types';
import { isParallelizable } from '../../services/events';
import EventsField from '.';

export interface EventParallelProps {
  event: ParallelEventsEvent;
  onValueChange?: (event: ParallelEventsEvent) => void;
}

const EventParallel = ({
  event,
  onValueChange,
}: EventParallelProps) => {
  const onValueChange_ = (name: string, value: SceneEvent[]) => {
    set(event, name, value);
    onValueChange?.(event);
  };

  return (
    <div className="flex flex-col gap-2">
      <EventParallelDroppable event={event}>
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

export interface EventParallelDroppableProps extends CardProps {
  event: ParallelEventsEvent;
}

const EventParallelDroppable = ({
  event,
  children,
}: EventParallelDroppableProps) => {
  const { source } = useDragOperation();
  const { isDropTarget, ref } = useDroppable({
    id: event.id + '-events',
    accept: 'event',
    collisionPriority: CollisionPriority.Highest,
    data: { event, zone: 'events' },
  });

  const isValidTarget = !source ||
    isParallelizable((source.data as { event: SceneEvent })?.event?.type);

  return (
    <Card
      ref={ref}
      className={isDropTarget && source?.data?.event.id !== event.id && isValidTarget
        ? 'outline-2 outline-dashed outline-blue-500' : ''}
    >
      { children }
    </Card>
  );
};

export default EventParallel;
