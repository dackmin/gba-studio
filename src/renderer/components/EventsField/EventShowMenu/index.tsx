import { useCallback, useMemo } from 'react';
import { Button, Card, Inset, Text } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { v4 as uuid } from 'uuid';
import { set } from '@junipero/react';

import type { GameMenuChoice, ShowMenuEvent } from '../../../../types';
import { findFont } from '../../../../helpers';
import { SceneFormContext } from '../../../services/contexts';
import { useApp, useCanvas } from '../../../services/hooks';
import DirectionField from '../../DirectionField';
import FontsListField from '../../FontsListField';
import Choice from './Choice';
import Collapsible from '../../Collapsible';
import ColorField from '../../ColorField';
import SpritesListField from '../../SpritesListField';

export interface EventShowMenuProps {
  event: ShowMenuEvent;
  onValueChange?: (event: ShowMenuEvent) => void;
}

const EventShowMenu = ({
  event,
  onValueChange,
}: EventShowMenuProps) => {
  const { selectedScene } = useCanvas();
  const { fonts, project } = useApp();
  const font = useMemo(() => (
    event.font ? findFont(fonts, event.font) : undefined
  ), [fonts, event.font]);

  const addChoice = useCallback(() => {
    const newChoice: GameMenuChoice = {
      type: 'menu-choice',
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
            exclude={['left', 'right', 'up', 'down', 'player']}
            onValueChange={onValueChange_.bind(null, 'direction')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Text size="1" className="text-slate">Font</Text>
          <FontsListField
            value={event.font || ''}
            onValueChange={onValueChange_.bind(null, 'font')}
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
                    font={font}
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
        <div className="flex flex-col gap-2">
          <Collapsible.Root>
            <Collapsible.Trigger className="px-0! py-0! text-sm! text-slate">
              Advanced
            </Collapsible.Trigger>
            <Collapsible.Content className="mt-4! flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Text size="1" className="text-slate">Font</Text>
                <FontsListField
                  value={event.font || ''}
                  onValueChange={onValueChange_.bind(null, 'font')}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Text size="1" className="text-slate">Text Color</Text>
                <ColorField
                  value={event.textColor || ''}
                  placeholder={project?.settings?.textColor}
                  onValueChange={onValueChange_.bind(null, 'textColor')}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Text size="1" className="text-slate">Background Sprite</Text>
                <SpritesListField
                  nullable={true}
                  value={event.background || ''}
                  onValueChange={onValueChange_.bind(null, 'background')}
                />
              </div>
            </Collapsible.Content>
          </Collapsible.Root>
        </div>
      </div>
    </SceneFormContext>
  );
};

export default EventShowMenu;
