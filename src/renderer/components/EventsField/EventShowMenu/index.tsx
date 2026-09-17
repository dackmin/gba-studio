import { useCallback } from 'react';
import { Button, Card, Inset, Text } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { v4 as uuid } from 'uuid';
import { set } from '@junipero/react';

import type { GameMenuChoice, ShowMenuEvent } from '../../../../types';
import { SceneFormContext } from '../../../services/contexts';
import { useCanvas } from '../../../services/hooks';
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
  const { selectedScene } = useCanvas();

  const addChoice = useCallback(() => {
    const newChoice = {
      id: uuid(),
      text: 'New Choice',
      events: [],
    };

    event.choices.push(newChoice);
    onValueChange?.(event);
  }, [onValueChange, event]);

  const onDrop = useCallback((
    target: GameMenuChoice,
    data: GameMenuChoice,
    position: 'before' | 'after'
  ) => {
    const sourceIndex = event.choices.findIndex(c => c.id === data.id);

    if (sourceIndex >= 0) {
      event.choices.splice(sourceIndex, 1);
    }

    const targetIndex = event.choices.findIndex(c => c.id === target.id);

    if (targetIndex >= 0) {
      event.choices.splice(
        position === 'before' ? targetIndex : targetIndex + 1,
        0,
        data
      );
    }

    onValueChange?.({ ...event, choices: [...event.choices] });
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

  const getContext = useCallback(() => ({
    scene: selectedScene,
  }), [selectedScene]);

  return (
    <SceneFormContext value={getContext()}>
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
                    onDrop={onDrop}
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
    </SceneFormContext>
  );
};

export default EventShowMenu;
