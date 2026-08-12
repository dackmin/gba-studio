import { useCallback, useRef, useState } from 'react';
import { Button, Dialog, Text, VisuallyHidden } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { cloneDeep, get, omit, set } from '@junipero/react';
import { v4 as uuid } from 'uuid';
import { type DragEndEvent, DragDropProvider, PointerSensor } from '@dnd-kit/react';
import { RestrictToElement } from '@dnd-kit/dom/modifiers';
import { Droppable, PointerActivationConstraints } from '@dnd-kit/dom';
import { move } from '@dnd-kit/helpers';
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';

import type { SceneEvent } from '../../../types';
import { getEventDefinition, getEventParent, isChildOfEvent } from '../../services/events';
import Event from './Event';
import Catalogue from './Catalogue';

export interface EventsFieldProps {
  value: SceneEvent[];
  zone?: string;
  onValueChange?: (events: SceneEvent[]) => void;
}

const EventsField = ({
  value,
  zone,
  onValueChange,
}: EventsFieldProps) => {
  const addEventButtonRef = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState<
    [SceneEvent, 'append' | 'prepend']
  >();

  const onDeleteEvent = useCallback((event: SceneEvent) => {
    onValueChange?.(value.filter(e => e !== event));
  }, [onValueChange, value]);

  const onChangeEvent = useCallback((
    index: number | string,
    event: SceneEvent
  ) => {
    onValueChange?.(value
      .map((e, i) => e.id === index || index === i ? event : e));
  }, [onValueChange, value]);

  const onAddEvent = useCallback((eventType: string) => {
    const [sourceEvent, position] = selected || [];
    const index = sourceEvent ? value.indexOf(sourceEvent) : -1;

    if (index === -1) {
      return onValueChange?.([
        ...value,
        {
          ...getEventDefinition(eventType).construct?.(),
          id: uuid(),
          type: eventType,
        },
      ]);
    }

    onValueChange?.([
      ...value.slice(0, position === 'prepend' ? index : index + 1),
      {
        ...getEventDefinition(eventType).construct?.(),
        id: uuid(),
        type: eventType,
      },
      ...value.slice(position === 'prepend' ? index : index + 1),
    ]);
    setSelected(undefined);
  }, [onValueChange, value, selected]);

  const onCloneEvent = useCallback((
    event: SceneEvent,
    clipboard: SceneEvent,
    position: 'append' | 'prepend' = 'append',
  ) => {
    const index = value.indexOf(event);

    if (index === -1) {
      return onValueChange?.([
        ...value,
        {
          ...cloneDeep(omit(clipboard, ['id'])),
          id: uuid(),
        },
      ]);
    }

    onValueChange?.([
      ...value.slice(0, position === 'prepend' ? index : index + 1),
      {
        ...cloneDeep(omit(clipboard, ['id'])),
        id: uuid(),
      },
      ...value.slice(position === 'prepend' ? index : index + 1),
    ]);
  }, [onValueChange, value]);

  const onPrependClick = useCallback((
    event: SceneEvent,
    clipboard?: SceneEvent,
  ) => {
    if (clipboard) {
      return onCloneEvent(event, clipboard, 'prepend');
    }

    setSelected([event, 'prepend']);
    addEventButtonRef.current?.click();
  }, [onCloneEvent]);

  const onAppendClick = useCallback((
    event: SceneEvent,
    clipboard?: SceneEvent,
  ) => {
    if (clipboard) {
      return onCloneEvent(event, clipboard, 'append');
    }

    setSelected([event, 'append']);
    addEventButtonRef.current?.click();
  }, [onCloneEvent]);

  const onDragEnd = useCallback((event: DragEndEvent) => {
    if (event.operation.target instanceof Droppable) {
      const sourceData = event.operation.source?.data as { event: SceneEvent, zone: string };
      const targetData = event.operation.target?.data as { event: SceneEvent, zone: string };
      const sourceParent = getEventParent(event.operation.source?.id?.toString() || '', value);

      if (
        sourceData.event.id === targetData.event.id ||
        isChildOfEvent(targetData.event.id, sourceData.event.id, value)
      ) {
        return;
      }

      if (!sourceData.event || !targetData.event) {
        return;
      }

      let res = value;

      if (!sourceParent) {
        res = res.filter(e => e.id !== sourceData.event.id);
      } else {
        set(sourceParent, sourceData.zone, [
          ...get<SceneEvent, SceneEvent[]>(sourceParent, sourceData.zone, [])
            .filter(e => e.id !== sourceData.event.id),
        ]);
      }

      set(targetData.event, targetData.zone, [
        ...get<SceneEvent, SceneEvent[]>(targetData.event, targetData.zone, []),
        sourceData.event,
      ]);

      onValueChange?.(res);

      return;
    }

    onValueChange?.(move(value, event));
  }, [onValueChange, value]);

  return (
    <DragDropProvider
      onDragEnd={onDragEnd}
      modifiers={[RestrictToVerticalAxis, RestrictToElement]}
      sensors={defaults => [
        ...defaults.filter(sensor => sensor !== PointerSensor),
        PointerSensor.configure({
          activationConstraints: [
            new PointerActivationConstraints.Distance({ value: 8 }),
            new PointerActivationConstraints.Delay({ value: 200, tolerance: 10 }),
          ],
        }),
      ]}
    >
      <div className="flex flex-col gap-[1px]">
        <div className="flex flex-col gap-[1px]">
          { value.length === 0 ? (
            <Text size="2" className="block p-3 text-center text-slate">
              No events
            </Text>
          ) : value.map((event, index) => (
            <Event
              key={event.id}
              index={index}
              event={event}
              zone={zone}
              onValueChange={onChangeEvent.bind(null, event.id || index)}
              onDelete={onDeleteEvent}
              onPrepend={onPrependClick}
              onAppend={onAppendClick}
            />
          )) }
        </div>

        <div className="px-3 my-3">
          <Dialog.Root>
            <Dialog.Trigger>
              <Button ref={addEventButtonRef} className="block !w-full">
                <PlusIcon />
                <Text>Add Event</Text>
              </Button>
            </Dialog.Trigger>
            <Dialog.Content>
              <VisuallyHidden>
                <Dialog.Title>Event Palette</Dialog.Title>
                <Dialog.Description>
                  Select an event to add to the list
                </Dialog.Description>
              </VisuallyHidden>
              <Catalogue onSelect={onAddEvent} />
            </Dialog.Content>
          </Dialog.Root>
        </div>
      </div>
    </DragDropProvider>
  );
};

export default EventsField;
