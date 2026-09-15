import { type ChangeEvent, useCallback, useState } from 'react';
import { set } from '@junipero/react';
import { Select, Text, TextField } from '@radix-ui/themes';

import type { EventValue, WaveEffectEvent } from '../../../types';
import { useDelayedCallback } from '../../services/hooks';
import EventValueField from '../EventValueField';

export interface EventWaveEffectProps {
  event: WaveEffectEvent;
  onValueChange?: (event: WaveEffectEvent) => void;
}

const EventWaveEffect = ({
  event: eventProp,
  onValueChange,
}: EventWaveEffectProps) => {
  const [event, setEvent] = useState(eventProp);
  const onDelayedValueChange = useDelayedCallback(onValueChange, 300);

  const onNumberChange = useCallback((
    name: string,
    min: number,
    max: number,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    set(event, name, Math.min(max, Math.max(min, Number(e.target.value) || 0)));
    setEvent(event);
    onDelayedValueChange?.(event);
  }, [event, onDelayedValueChange]);

  const onTargetChange = useCallback((target: string) => {
    set(event, 'target', target);
    setEvent(event);
    onValueChange?.(event);
  }, [event, onValueChange]);

  const onDurationChange = useCallback((value: EventValue) => {
    set(event, 'duration', value);
    setEvent(event);
    onDelayedValueChange?.(event);
  }, [event, onDelayedValueChange]);

  const onEnvelopeChange = useCallback((envelope: string) => {
    set(event, 'envelope', envelope);
    setEvent(event);
    onValueChange?.(event);
  }, [event, onValueChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Target</Text>
        <Select.Root
          value={event.target || 'both'}
          onValueChange={onTargetChange}
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
        <Text size="1" className="text-slate">Amplitude</Text>
        <TextField.Root
          type="number"
          min={0}
          max={32}
          value={event.amplitude ?? 4}
          onChange={onNumberChange.bind(null, 'amplitude', 0, 32)}
        >
          <TextField.Slot side="right">px</TextField.Slot>
        </TextField.Root>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Speed</Text>
        <TextField.Root
          type="number"
          min={0}
          max={90}
          value={event.speed ?? 4}
          onChange={onNumberChange.bind(null, 'speed', 0, 90)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Frequency</Text>
        <TextField.Root
          type="number"
          min={1}
          max={16}
          value={event.frequency ?? 1}
          onChange={onNumberChange.bind(null, 'frequency', 1, 16)}
        />
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
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Amplitude ramp</Text>
        <Select.Root
          value={event.envelope || 'in'}
          onValueChange={onEnvelopeChange}
        >
          <Select.Trigger className="!w-full" />
          <Select.Content>
            <Select.Item value="in">0% -&gt; 100%</Select.Item>
            <Select.Item value="in-out">0% -&gt; 100% -&gt; 0%</Select.Item>
            <Select.Item value="out">100% -&gt; 0%</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  );
};

export default EventWaveEffect;
