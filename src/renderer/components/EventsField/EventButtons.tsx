import {
  Card,
  Inset,
  SegmentedControl,
  Separator,
  Text,
} from '@radix-ui/themes';
import { ToggleGroup } from 'radix-ui';
import { classNames, set } from '@junipero/react';
import {
  TriangleDownIcon,
  TriangleLeftIcon,
  TriangleRightIcon,
  TriangleUpIcon,
} from '@radix-ui/react-icons';

import type { OnButtonPressEvent, WaitForButtonEvent } from '../../../types';
import EventsField from '.';

export interface EventButtonsProps {
  event: WaitForButtonEvent | OnButtonPressEvent;
  onValueChange?: (event: WaitForButtonEvent | OnButtonPressEvent) => void;
}

const EventButtons = ({
  event,
  onValueChange,
}: EventButtonsProps) => {
  const onValueChange_ = (name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  };

  return (
    <div className="flex flex-col gap-4">
      { event.type === 'wait-for-button' && (
        <div className="flex flex-col items-start gap-2">
          <Text size="1" className="text-slate">Mode</Text>
          <SegmentedControl.Root
            size="1"
            value={'' + (event.every ?? false)}
            onValueChange={v => onValueChange_('every', v === 'true')}
          >
            <SegmentedControl.Item value="false">
              Some
            </SegmentedControl.Item>
            <SegmentedControl.Item value="true">
              Every
            </SegmentedControl.Item>
          </SegmentedControl.Root>
        </div>
      ) }
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Buttons</Text>
        <ToggleGroup.Root
          value={event.buttons}
          onValueChange={onValueChange_.bind(null, 'buttons')}
          type="multiple"
          className={classNames(
            // Parent
            'rounded-sm bg-(--gray-a2) h-(--space-6) flex items-center',
            // Children
            '[&_button]:h-full',
            '[&_button]:flex-auto [&_button]:flex [&_button]:items-center',
            '[&_button]:justify-center [&_button]:hover:bg-(--gray-a2)',
            '[&_button]:text-xs [&_button]:rounded-sm [&_button]:relative',
            '[&_button]:data-[state=on]:bg-(--gray-a3)',
            '[&_button]:relative [&_button]:z-1',
            // eslint-disable-next-line @stylistic/max-len
            '[&_button]:data-[state=on]:shadow-[inset_0_0_0_1px_var(--gray-a2)]',
            '[&_button]:data-[state=on]:[&_+_.rt-Separator]:opacity-0',
            // Separators
            '[&_.rt-Separator]:has-[+_button[data-state=on]]:opacity-0',
            '[&_.rt-Separator]:flex-none [&_.rt-Separator]:!h-[calc(100%-6px)]',
            '[&_.rt-Separator]:relative [&_.rt-Separator]:z-0',
            '[&_.rt-Separator]:!bg-(--gray-a3)',
            '[&_.rt-Separator]:transition-opacity',
            '[&_.rt-Separator]:duration-200',
          )}
        >
          <ToggleGroup.Item value="A">A</ToggleGroup.Item>
          <Separator orientation="vertical" />
          <ToggleGroup.Item value="B">B</ToggleGroup.Item>
          <Separator orientation="vertical" />
          <ToggleGroup.Item value="Start">Start</ToggleGroup.Item>
          <Separator orientation="vertical" />
          <ToggleGroup.Item value="Select">Select</ToggleGroup.Item>
          <Separator orientation="vertical" />
          <ToggleGroup.Item value="Down"><TriangleDownIcon /></ToggleGroup.Item>
          <Separator orientation="vertical" />
          <ToggleGroup.Item value="Left"><TriangleLeftIcon /></ToggleGroup.Item>
          <Separator orientation="vertical" />
          <ToggleGroup.Item value="Up"><TriangleUpIcon /></ToggleGroup.Item>
          <Separator orientation="vertical" />
          <ToggleGroup.Item value="Right">
            <TriangleRightIcon />
          </ToggleGroup.Item>
          <Separator orientation="vertical" />
          <ToggleGroup.Item value="L">L</ToggleGroup.Item>
          <Separator orientation="vertical" />
          <ToggleGroup.Item value="R">R</ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>
      { event.type === 'on-button-press' && (
        <div className="flex flex-col gap-2">
          <Text size="1" className="text-slate">Events</Text>
          <Card>
            <Inset>
              <EventsField
                value={event.events ?? []}
                onValueChange={onValueChange_.bind(null, 'events')}
              />
            </Inset>
          </Card>
        </div>
      ) }
    </div>
  );
};

export default EventButtons;
