import { type ChangeEvent, type KeyboardEvent, useCallback } from 'react';
import { Heading, Inset, Separator, Text, TextField } from '@radix-ui/themes';
import { classNames, set } from '@junipero/react';

import type { GameScene, GameSensor } from '../../../types';
import { useCanvas, useDelayedCallback } from '../../services/hooks';
import EventsField from '../../components/EventsField';

export interface SensorFormProps {
  sensor: GameSensor;
  onChange?: (scene?: GameScene) => void;
}

const SensorForm = ({
  sensor,
  onChange,
}: SensorFormProps) => {
  const { selectedScene } = useCanvas();
  const onDelayedChange = useDelayedCallback(onChange, 300);

  const onNameChange = useCallback((e: ChangeEvent<HTMLHeadingElement>) => {
    const name = (e.currentTarget.textContent || 'Untitled')
      .trim().slice(0, 32);

    if (name === sensor.name) {
      return;
    }

    set(sensor, 'name', name);
    onChange?.(selectedScene);
  }, [onChange, sensor, selectedScene]);

  const onNameKeyDown = (e: KeyboardEvent<HTMLHeadingElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const onValueChange = useCallback((name: string, value: any) => {
    set(sensor, name, value);
    onChange?.(selectedScene);
  }, [onChange, sensor, selectedScene]);

  const onTextChange = useCallback((
    name: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    set(sensor, name, e.target.value);
    onDelayedChange?.(selectedScene);
  }, [onDelayedChange, sensor, selectedScene]);

  return (
    <div className="p-3 w-full h-full overflow-x-hidden overflow-y-scroll">
      <Text size="1" className="text-slate">Sensor</Text>
      <Heading
        contentEditable
        as="h2"
        size="4"
        className={classNames(
          'whitespace-nowrap overflow-scroll focus:outline-2',
          'outline-(--accent-9) rounded-xs editable',
        )}
        onKeyDown={onNameKeyDown}
        onBlur={onNameChange}
        suppressContentEditableWarning
      >
        { sensor.name }
      </Heading>
      <Inset side="x"><Separator className="!w-full my-4" /></Inset>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-2">
            <Text className="block text-slate" size="1">X</Text>
            <TextField.Root
              type="number"
              min={0}
              value={sensor.x ?? 0}
              onChange={onTextChange.bind(null, 'x')}
            >
              <TextField.Slot side="right">
                tiles
              </TextField.Slot>
            </TextField.Root>
          </div>
          <div className="flex flex-col gap-2">
            <Text className="block text-slate" size="1">Y</Text>
            <TextField.Root
              type="number"
              min={0}
              value={sensor.y ?? 0}
              onChange={onTextChange.bind(null, 'y')}
            >
              <TextField.Slot side="right">
                tiles
              </TextField.Slot>
            </TextField.Root>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-2">
            <Text className="block text-slate" size="1">Width</Text>
            <TextField.Root
              type="number"
              min={1}
              value={sensor.width ?? 1}
              onChange={onTextChange.bind(null, 'width')}
            >
              <TextField.Slot side="right">
                tiles
              </TextField.Slot>
            </TextField.Root>
          </div>
          <div className="flex flex-col gap-2">
            <Text className="block text-slate" size="1">Height</Text>
            <TextField.Root
              type="number"
              min={1}
              value={sensor.height ?? 2}
              onChange={onTextChange.bind(null, 'height')}
            >
              <TextField.Slot side="right">
                tiles
              </TextField.Slot>
            </TextField.Root>
          </div>
        </div>
      </div>
      <Inset side="x"><Separator className="!w-full my-4" /></Inset>
      <div className="flex flex-col gap-6">
        <Text className="block text-slate" size="1">Events</Text>
        <Inset>
          <EventsField
            value={sensor.events ?? []}
            onValueChange={onValueChange.bind(null, 'events')}
          />
        </Inset>
      </div>
    </div>
  );
};

export default SensorForm;
