import { type ChangeEvent, useCallback } from 'react';
import { set } from '@junipero/react';
import { Select, Slider, Text, TextField } from '@radix-ui/themes';

import type {
  PlaySoundEvent,
} from '../../../types';
import { getSoundName } from '../../../helpers';
import { useApp, useDelayedCallback } from '../../services/hooks';

export interface EventPlaySoundProps {
  event: PlaySoundEvent;
  onValueChange?: (
    event: PlaySoundEvent,
  ) => void;
}

const EventPlaySound = ({
  event,
  onValueChange,
}: EventPlaySoundProps) => {
  const { sounds } = useApp();
  const onDelayedValueChange = useDelayedCallback(onValueChange, 300);

  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);
    onDelayedValueChange?.(event);
  }, [event, onDelayedValueChange]);

  const onTextChange = useCallback((
    name: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    set(event, name, e.target.value);
    onDelayedValueChange?.(event);
  }, [event, onDelayedValueChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Sound</Text>
        <Select.Root
          value={event.name || ''}
          onValueChange={onValueChange_.bind(null, 'name')}
        >
          <Select.Trigger placeholder="Select" />
          <Select.Content>
            { sounds.map(track => (
              <Select.Item key={track} value={getSoundName(track)}>
                { getSoundName(track) }
              </Select.Item>
            )) }
          </Select.Content>
        </Select.Root>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Volume</Text>
        <div className="flex items-center gap-2">
          <Slider
            min={0}
            max={100}
            value={[
              (event.volume ?? 100) > 0 && (event.volume ?? 100) < 1
                ? (event.volume ?? 100) * 100
                : event.volume ?? 100,
            ]}
            onValueChange={onValueChange_.bind(null, 'volume')}
          />
          <Text className="block w-[60px] text-right">
            { (event.volume ?? 100) > 0 && (event.volume ?? 100) < 1
              ? (event.volume ?? 100) * 100
              : event.volume ?? 100 }%
          </Text>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Speed</Text>
        <div className="flex items-center gap-2">
          <Slider
            min={0}
            max={64}
            value={[event.speed ?? 1]}
            onValueChange={onValueChange_.bind(null, 'speed')}
          />
          <Text className="block w-[60px] text-right">
            { event.speed ?? 1 }x
          </Text>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Pan</Text>
        <div className="flex items-center gap-2">
          <Slider
            min={-100}
            max={100}
            value={[
              (event.pan ?? 0) > -1 && (event.pan ?? 0) < 1
                ? (event.pan ?? 0) * 100
                : event.pan ?? 0,
            ]}
            onValueChange={onValueChange_.bind(null, 'pan')}
          />
          <Text className="block w-[60px] text-right">
            { (event.pan ?? 0) > -1 && (event.pan ?? 0) < 1
              ? (event.pan ?? 0) * 100
              : event.pan ?? 0 }%
          </Text>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Priority</Text>
        <TextField.Root
          type="number"
          value={event.priority ?? 32767}
          min={-32767}
          max={32767}
          onChange={onTextChange.bind(null, 'priority')}
        />
      </div>
    </div>
  );
};

export default EventPlaySound;
