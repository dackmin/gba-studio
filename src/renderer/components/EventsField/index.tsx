import { useCallback, useRef, useState } from 'react';
import { Button, Dialog, Text, VisuallyHidden } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { cloneDeep, omit } from '@junipero/react';
import { v4 as uuid } from 'uuid';

import type { SceneEvent } from '../../../types';
import { getEventDefinition } from '../../services/events';
import Event from './Event';
import Catalogue from './Catalogue';

export interface EventsFieldProps {
  value: SceneEvent[];
  onValueChange?: (events: SceneEvent[]) => void;
}

const EventsField = ({
  value,
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

  return (
    <div className="flex flex-col gap-[1px]">
      { value.length === 0 ? (
        <Text size="2" className="block p-3 text-center text-slate">
          No events
        </Text>
      ) : value.map((event, index) => (
        <Event
          key={event.id || index}
          event={event}
          onValueChange={onChangeEvent.bind(null, event.id || index)}
          onDelete={onDeleteEvent}
          onPrepend={onPrependClick}
          onAppend={onAppendClick}
        />
      )) }

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
  );
};

export default EventsField;
