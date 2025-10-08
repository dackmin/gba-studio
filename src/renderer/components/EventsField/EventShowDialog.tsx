import { type ChangeEvent, useCallback, useState } from 'react';
import { set } from '@junipero/react';
import { Text, TextArea } from '@radix-ui/themes';

import type {
  ShowDialogEvent,
} from '../../../types';
import { useDelayedCallback } from '../../services/hooks';

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Text</Text>
        <TextArea
          rows={4}
          value={event.text}
          onChange={onChange.bind(null, 'text')}
        />
      </div>
    </div>
  );
};

export default EventShowDialog;
