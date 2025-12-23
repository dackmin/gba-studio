import { useCallback, useMemo } from 'react';
import { Button, Card, Inset, Text } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { v4 as uuid } from 'uuid';
import { set } from '@junipero/react';
import {
  type DragEndEvent,
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';

import type { GameMenuChoice, ShowMenuEvent } from '../../../../types';
import Choice from './Choice';
import DirectionField from '../../DirectionField';

export interface EventShowMenuProps {
  event: ShowMenuEvent;
  onValueChange?: (event: ShowMenuEvent) => void;
}

const EventShowMenu = ({
  event,
  onValueChange,
}: EventShowMenuProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const choiceIds = useMemo(() => (
    event.choices?.map(e => e.id || '')
  ), [event.choices]);

  const addChoice = useCallback(() => {
    const newChoice = {
      id: uuid(),
      text: 'New Choice',
      events: [],
    };

    event.choices.push(newChoice);
    onValueChange?.(event);
  }, [onValueChange, event]);

  const onDragEnd = useCallback((evt: DragEndEvent) => {
    const oldIndex = event.choices.findIndex(e => e.id === evt.active.id);
    const newIndex = event.choices.findIndex(e => e.id === evt.over?.id);
    event.choices = arrayMove(event.choices, oldIndex, newIndex);
    onValueChange?.(event);
  }, [onValueChange, event]);

  const onChoiceDelete = useCallback((choice: GameMenuChoice) => {
    event.choices = event.choices.filter(c => c !== choice);
    onValueChange?.(event);
  }, [onValueChange, event]);

  const onChoiceChange = useCallback(() => {
    onValueChange?.(event);
  }, [onValueChange, event]);

  const onValueChange_ = useCallback((
    name: string,
    value: any
  ) => {
    set(event, name, value);
    onValueChange?.(event);
  }, [onValueChange, event]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext
        items={choiceIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Text size="1" className="text-slate">Disposition</Text>
            <DirectionField
              value={event.direction || 'bottom_right'}
              exclude={['left', 'right', 'up', 'down']}
              onValueChange={onValueChange_.bind(null, 'direction')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Text size="1" className="text-slate">Choices</Text>
            <Card>
              <Inset>
                <div className="flex flex-col gap-[1px]">
                  { event.choices.map((choice, i) => (
                    <Choice
                      key={choice.id}
                      index={i}
                      choice={choice}
                      choices={event.choices}
                      onDelete={onChoiceDelete}
                      onValueChange={onChoiceChange}
                    />
                  )) }
                </div>

                <div className="px-3 my-3">
                  <Button
                    variant="soft"
                    className="block !w-full"
                    onClick={addChoice}
                  >
                    <PlusIcon />
                    <Text>Add Choice</Text>
                  </Button>
                </div>
              </Inset>
            </Card>
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default EventShowMenu;
