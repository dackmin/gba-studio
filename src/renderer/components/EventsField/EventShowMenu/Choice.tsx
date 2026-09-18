import {
  type ChangeEvent,
  type DragEvent,
  type PointerEvent,
  useCallback,
  useRef,
  useState,
} from 'react';
import {
  Card,
  DropdownMenu,
  IconButton,
  Inset,
  Text,
  TextField,
} from '@radix-ui/themes';
import { DotsVerticalIcon } from '@radix-ui/react-icons';
import { type DraggingPositionType, Draggable, Droppable, set, classNames } from '@junipero/react';
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
  onDrop?: (
    target: GameMenuChoice,
    data: GameMenuChoice,
    position: DraggingPositionType,
    e: DragEvent<HTMLDivElement>
  ) => void;
}

const Choice = ({
  index,
  choice,
  choices,
  onDelete,
  onValueChange,
  onDrop,
}: ChoiceProps) => {
  const [opened, setOpened] = useState(false);
  const textFieldRef = useRef<HTMLDivElement>(null);
  const dragOriginRef = useRef<EventTarget | null>(null);

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

  const onDragStart = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (textFieldRef.current?.contains(dragOriginRef.current as Node)) {
      e.preventDefault();

      return;
    }

    e.stopPropagation();
  }, []);

  return (
    <Droppable onDrop={onDrop?.bind(null, choice)}>
      <Draggable
        data={choice}
        onDragStart={onDragStart}
        onDragEnd={e => e.stopPropagation()}
        onDrag={e => e.stopPropagation()}
        onPointerDownCapture={(e: PointerEvent<HTMLDivElement>) => {
          dragOriginRef.current = e.target;
        }}
      >
        <div
          key={choice.id}
          className={classNames(
            'group relative bg-(--gray-2) flex flex-col px-3 py-3 flex flex-col gap-4',

            // Drag start
            'dragging:border-2 dragging:border-(--accent-9) dragging:rounded-xl',

            // Dragged (e.g the element that stays behind)
            'dragged:not-has-[.dragging]:opacity-5',

            // Drop to top
            'drop-top:before:content-[""] drop-top:before:absolute drop-top:before:block',
            'drop-top:before:bg-(--accent-9)',
            'drop-top:before:h-[2px] drop-top:before:w-full',
            'drop-top:before:-top-px drop-top:before:left-0',
            'dragged:drag-top:before:hidden!',
            // If has containers, hide the drop indicators
            'has-[.drag-enter]:drop-top:before:hidden!',

            // Drop to bottom
            'drop-bottom:after:content-[""] drop-bottom:after:absolute drop-bottom:after:block',
            'drop-bottom:after:bg-(--accent-9)',
            'drop-bottom:after:h-[2px] drop-bottom:after:w-full',
            'drop-bottom:after:-bottom-px drop-bottom:after:left-0',
            'dragged:drag-bottom:after:hidden!',
          )}
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
          <div className="flex flex-col gap-2" ref={textFieldRef}>
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
      </Draggable>
    </Droppable>
  );
};

export default Choice;
