import { useCallback } from 'react';
import { Button, Card, Inset, Text } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { v4 as uuid } from 'uuid';
import { set } from '@junipero/react';
import {
  type DragEndEvent,
  DragDropProvider,
  PointerSensor,
} from '@dnd-kit/react';
import { RestrictToElement } from '@dnd-kit/dom/modifiers';
import { PointerActivationConstraints } from '@dnd-kit/dom';
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { move } from '@dnd-kit/helpers';

import type { GameMenuChoice, ShowMenuEvent } from '../../../../types';
import DirectionField from '../../DirectionField';
import Choice from './Choice';

export interface EventShowMenuProps {
  event: ShowMenuEvent;
  onValueChange?: (event: ShowMenuEvent) => void;
}

const EventShowMenu = ({
  event,
  onValueChange,
}: EventShowMenuProps) => {
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
    event.choices = move(event.choices, evt);
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Text size="1" className="text-slate">Disposition</Text>
          <DirectionField
            value={event.direction || 'down_right'}
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
    </DragDropProvider>
  );
};

export default EventShowMenu;
