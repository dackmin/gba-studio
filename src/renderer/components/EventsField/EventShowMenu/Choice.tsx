import { type ChangeEvent, useCallback, useState } from 'react';
import {
  Card,
  DropdownMenu,
  IconButton,
  Inset,
  Text,
  TextField,
} from '@radix-ui/themes';
import { DotsVerticalIcon } from '@radix-ui/react-icons';
import { useSortable } from '@dnd-kit/sortable';
import { classNames, set } from '@junipero/react';
import { Tooltip } from 'radix-ui';

import type { GameMenuChoice, SceneEvent } from '../../../../types';
import EventsField from '..';
import DialogMenuPreview from '../../DialogMenuPreview';

export interface ChoiceProps {
  index: number;
  choice: GameMenuChoice;
  choices: GameMenuChoice[];
  onDelete?: (choice: GameMenuChoice) => void;
  onValueChange?: (choice: GameMenuChoice) => void;
}

const Choice = ({
  index,
  choice,
  choices,
  onDelete,
  onValueChange,
}: ChoiceProps) => {
  const [opened, setOpened] = useState(false);
  const {
    attributes,
    listeners,
    transform,
    transition,
    setNodeRef,
  } = useSortable({ id: choice.id });

  const onTextChange = useCallback((
    name: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    set(choice, name, e.target.value);
    onValueChange?.(choice);
  }, [choice, onValueChange]);

  const onValueChange_ = useCallback((name: string, value: SceneEvent[]) => {
    set(choice, 'events', value);
    onValueChange?.(choice);
  }, [choice, onValueChange]);

  const onDeleteClick = useCallback(() => {
    onDelete?.(choice);
  }, [choice, onDelete]);

  return (
    <div
      key={choice.id}
      className="bg-(--gray-2) flex flex-col px-3 py-3 flex flex-col gap-4"
      ref={setNodeRef}
      style={{
        transform: `translate3d(${transform?.x || 0}px, ` +
          `${transform?.y || 0}px, 0)`,
        transition,
      }}
      { ...attributes }
      { ...listeners }
    >
      <div
        className="w-full flex items-center flex-nowrap"
      >
        <div
          className={classNames(
            'whitespace-nowrap overflow-hidden text-ellipsis flex-auto',
          )}
        >
          Choice { index + 1 }
        </div>

        <div className="flex-none flex items-center gap-1">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger onClick={e => e.stopPropagation()}>
              <IconButton variant="ghost" size="1">
                <DotsVerticalIcon />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item onClick={onDeleteClick}>
                Delete Choice
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Text</Text>
        <Tooltip.Root open={opened} delayDuration={0}>
          <Tooltip.Trigger asChild>
            <TextField.Root
              value={choice.text}
              onChange={onTextChange.bind(null, 'text')}
              onFocus={() => setOpened(true)}
              onBlur={() => setOpened(false)}
            />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="left" align="center" sideOffset={20}>
              <DialogMenuPreview
                items={choices.map(c => c.text)}
                current={index}
              />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">On Select</Text>
        <Card>
          <Inset>
            <EventsField
              value={choice.events ?? []}
              onValueChange={onValueChange_.bind(null, 'then')}
            />
          </Inset>
        </Card>
      </div>
    </div>
  );
};

export default Choice;
