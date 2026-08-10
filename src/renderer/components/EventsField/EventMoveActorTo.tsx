import { useCallback, useEffect, useMemo, useState } from 'react';
import { set } from '@junipero/react';
import { Select, Switch, Text, TextField } from '@radix-ui/themes';

import type { MoveCameraToEvent } from '../../../types';
import { getImageSize, pixelToTile } from '../../../helpers';
import { useApp, useSceneForm } from '../../services/hooks';
import EventValueField from '../EventValueField';

export interface EventMoveCameraToProps {
  event: MoveCameraToEvent;
  onValueChange?: (
    event: MoveCameraToEvent,
  ) => void;
}

const EventMoveCameraTo = ({
  event,
  onValueChange,
}: EventMoveCameraToProps) => {
  const { eventEmitter, backgrounds } = useApp();
  const { scene } = useSceneForm();
  const [size, setSize] = useState([240, 160]);

  const background = useMemo(() => (
    backgrounds.find(bg => bg._file === (scene?.background || '') + '.json')
  ), [backgrounds, scene?.background]);

  const backgroundPath = useMemo(() => (
    !background?._file || !scene?.background ||
    scene.background === 'bg_default'
      ? `resources://public/templates/` +
        `commons/graphics/bg_default.bmp`
      : `project://graphics/${scene.background}.bmp`
  ), [scene, background?._file]);

  const updateSize = useCallback(async () => {
    try {
      const [width, height] = await getImageSize(backgroundPath);
      setSize([Math.max(240, width), Math.max(160, height)]);
    } catch {
      setSize([240, 160]);
    }
  }, [backgroundPath]);

  useEffect(() => {
    updateSize();
  }, [updateSize]);

  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);

    if (['x', 'y'].includes(name)) {
      eventEmitter?.emit('scene:camera:set', {
        x: typeof event.x === 'number' ? event.x : 0,
        y: typeof event.y === 'number' ? event.y : 0,
        sceneId: scene?.id,
      });
    }

    onValueChange?.(event);
  }, [eventEmitter, event, onValueChange, scene?.id]);

  const onFocus = useCallback(() => {
    eventEmitter?.emit('scene:camera:set', {
      x: typeof event.x === 'number' ? event.x : 0,
      y: typeof event.y === 'number' ? event.y : 0,
      sceneId: scene?.id,
    });
  }, [eventEmitter, event.x, event.y, scene?.id]);

  const onBlur = useCallback(() => {
    eventEmitter?.emit('scene:camera:reset', {
      sceneId: scene?.id,
    });
  }, [eventEmitter, scene?.id]);

  return (
    <div
      className="flex flex-col gap-4"
      onMouseEnter={onFocus}
      onMouseLeave={onBlur}
    >
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-2">
            <Text size="1" className="text-slate">X</Text>
            <EventValueField
              type="number"
              value={event.x}
              onValueChange={onValueChange_.bind(null, 'x')}
              min={0}
              max={pixelToTile(size[0] - 240, scene?.map?.gridSize || 16)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Text size="1" className="text-slate">Y</Text>
            <EventValueField
              type="number"
              value={event.y}
              onValueChange={onValueChange_.bind(null, 'y')}
              min={0}
              max={pixelToTile(size[1] - 160, scene?.map?.gridSize || 16)}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Duration</Text>
        <EventValueField
          type="number"
          value={event.duration}
          onValueChange={onValueChange_.bind(null, 'duration')}
        >
          <TextField.Slot side="right">ms</TextField.Slot>
        </EventValueField>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Allow Diagonal</Text>
        <Switch
          checked={!!event.allowDiagonal}
          onCheckedChange={onValueChange_.bind(null, 'allowDiagonal')}
        />
      </div>
      { !event.allowDiagonal && (
        <div className="flex flex-col gap-2">
          <Text size="1" className="text-slate">Direction Priority</Text>
          <Select.Root
            value={event.directionPriority || 'horizontal'}
            onValueChange={onValueChange_.bind(null, 'directionPriority')}
          >
            <Select.Trigger placeholder="Select" />
            <Select.Content>
              <Select.Item value="horizontal">Horizontal</Select.Item>
              <Select.Item value="vertical">Vertical</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>
      ) }
    </div>
  );
};

export default EventMoveCameraTo;
