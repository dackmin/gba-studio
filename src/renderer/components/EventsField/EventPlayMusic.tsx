import { useCallback } from 'react';
import { set } from '@junipero/react';
import { Select, Slider, Switch, Text } from '@radix-ui/themes';

import type {
  PlayMusicEvent,
} from '../../../types';
import { getSoundName } from '../../../helpers';
import { useApp } from '../../services/hooks';

export interface EventPlayMusicProps {
  event: PlayMusicEvent;
  onValueChange?: (
    event: PlayMusicEvent,
  ) => void;
}

const EventPlayMusic = ({
  event,
  onValueChange,
}: EventPlayMusicProps) => {
  const { music } = useApp();

  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  }, [event, onValueChange]);

  const onSliderChange = useCallback((name: string, value: number[]) => {
    set(event, name, value[0]);
    onValueChange?.(event);
  }, [event, onValueChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-2 flex-auto">
          <Text size="1" className="text-slate">Music</Text>
          <Select.Root
            value={event.name || ''}
            onValueChange={onValueChange_.bind(null, 'name')}
          >
            <Select.Trigger placeholder="Select" />
            <Select.Content>
              { music.map(track => (
                <Select.Item key={track} value={getSoundName(track)}>
                  { getSoundName(track) }
                </Select.Item>
              )) }
            </Select.Content>
          </Select.Root>
        </div>
        <div className="flex flex-col gap-2">
          <Text size="1" className="text-slate">Loop</Text>
          <Switch
            checked={!!event.loop}
            onCheckedChange={onValueChange_.bind(null, 'loop')}
          />
        </div>
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
            onValueChange={onSliderChange.bind(null, 'volume')}
          />
          <Text className="block w-[60px] text-right">
            { (event.volume ?? 100) > 0 && (event.volume ?? 100) < 1
              ? (event.volume ?? 100) * 100
              : event.volume ?? 100 }%
          </Text>
        </div>
      </div>
    </div>
  );
};

export default EventPlayMusic;
