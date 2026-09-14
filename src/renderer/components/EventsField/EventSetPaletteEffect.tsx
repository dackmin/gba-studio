import { type ChangeEvent, useCallback, useState } from 'react';
import { set } from '@junipero/react';
import { Select, Text, TextField } from '@radix-ui/themes';

import type { EventValue, SetPaletteEffectEvent } from '../../../types';
import { useDelayedCallback } from '../../services/hooks';
import EventValueField from '../EventValueField';

export interface EventSetPaletteEffectProps {
  event: SetPaletteEffectEvent;
  onValueChange?: (event: SetPaletteEffectEvent) => void;
}

const EventSetPaletteEffect = ({
  event: eventProp,
  onValueChange,
}: EventSetPaletteEffectProps) => {
  const [event, setEvent] = useState(eventProp);
  const onDelayedValueChange = useDelayedCallback(onValueChange, 300);

  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);
    setEvent(event);
    onValueChange?.(event);
  }, [event, onValueChange]);

  const onDurationChange = useCallback((value: EventValue) => {
    set(event, 'duration', value);
    setEvent(event);
    onDelayedValueChange?.(event);
  }, [event, onDelayedValueChange]);

  const onNumberChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    onValueChange_(
      'value',
      Math.min(100, Math.max(0, Number(e.target.value) || 0))
    );
  }, [onValueChange_]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Target</Text>
        <Select.Root
          value={event.target || 'both'}
          onValueChange={onValueChange_.bind(null, 'target')}
        >
          <Select.Trigger className="!w-full" />
          <Select.Content>
            <Select.Item value="both">Background &amp; sprites</Select.Item>
            <Select.Item value="background">Background</Select.Item>
            <Select.Item value="sprite">Sprites</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Effect</Text>
        <Select.Root
          value={event.effect || 'grayscale'}
          onValueChange={onValueChange_.bind(null, 'effect')}
        >
          <Select.Trigger className="!w-full" />
          <Select.Content>
            <Select.Item value="brightness">Brightness</Select.Item>
            <Select.Item value="contrast">Contrast</Select.Item>
            <Select.Item value="intensity">Intensity</Select.Item>
            <Select.Item value="grayscale">Grayscale</Select.Item>
            <Select.Item value="hue-shift">Hue shift</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Value</Text>
        <TextField.Root
          type="number"
          min={0}
          max={100}
          value={event.value ?? 100}
          onChange={onNumberChange}
        >
          <TextField.Slot side="right">%</TextField.Slot>
        </TextField.Root>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Duration</Text>
        <EventValueField
          type="number"
          value={event.duration}
          onValueChange={onDurationChange}
          min={0}
        >
          <TextField.Slot side="right">ms</TextField.Slot>
        </EventValueField>
      </div>
    </div>
  );
};

export default EventSetPaletteEffect;
