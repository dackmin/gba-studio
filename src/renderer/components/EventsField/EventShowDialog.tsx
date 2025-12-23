import { type ChangeEvent, useCallback, useState } from 'react';
import { set } from '@junipero/react';
import { Text, TextArea } from '@radix-ui/themes';
import { Tooltip } from 'radix-ui';

import type { ShowDialogEvent } from '../../../types';
import { useDelayedCallback } from '../../services/hooks';
import DialogPreview from '../DialogPreview';
import DirectionField from '../DirectionField';

export interface EventShowDialogProps {
  event: ShowDialogEvent;
  onValueChange?: (
    event: ShowDialogEvent,
  ) => void;
}

const EventShowDialog = ({
  event: eventProp,
  onValueChange,
}: EventShowDialogProps) => {
  const [event, setEvent] = useState(eventProp);
  const [opened, setOpened] = useState(false);
  // Performance optimizations
  const onDelayedValueChange = useDelayedCallback(onValueChange, 300);

  const onChange = useCallback((
    name: string,
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    set(event, name, e.target.value);
    setEvent(event);
    onDelayedValueChange?.(event);
  }, [event, onDelayedValueChange]);

  const onValueChange_ = useCallback((
    name: string,
    value: any
  ) => {
    set(event, name, value);
    setEvent(event);
    onValueChange?.(event);
  }, [onValueChange, event]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Disposition</Text>
        <DirectionField
          value={event.direction || 'down'}
          exclude={['left', 'right', 'up_left', 'up_right',
            'down_left', 'down_right']}
          onValueChange={onValueChange_.bind(null, 'direction')}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Text</Text>
        <div className="relative">
          <Tooltip.Root
            open={opened}
            delayDuration={0}
          >
            <Tooltip.Trigger asChild>
              <TextArea
                rows={4}
                value={event.text}
                onChange={onChange.bind(null, 'text')}
                onFocus={() => setOpened(true)}
                onBlur={() => setOpened(false)}
              />
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="left" align="center" sideOffset={20}>
                <DialogPreview
                  className="absolute top-1/2 right-full -translate-y-1/2 ml-4"
                  text={event.text}
                />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      </div>
    </div>
  );
};

export default EventShowDialog;
