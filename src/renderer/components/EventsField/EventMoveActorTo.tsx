import { useCallback, useEffect, useMemo, useState } from 'react';
import { set } from '@junipero/react';
import { Select, Text, TextField } from '@radix-ui/themes';

import type { MoveActorToEvent } from '../../../types';
import { getImageSize, pixelToTile } from '../../../helpers';
import { useApp, useSceneForm } from '../../services/hooks';
import EventValueField from '../EventValueField';

export interface EventMoveActorToProps {
  event: MoveActorToEvent;
  onValueChange?: (
    event: MoveActorToEvent,
  ) => void;
}

const EventMoveActorTo = ({
  event,
  onValueChange,
}: EventMoveActorToProps) => {
  const { backgrounds, sprites } = useApp();
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
      : `project://${background.path}`
  ), [scene, background]);

  const actor = useMemo(() => (
    scene?.actors?.find(actor => actor.id === event?.actor)
  ), [scene, event]);

  const animations = useMemo(() => (
    sprites.find(sprite => sprite._file === actor?.sprite + '.json')?.animations || []
  ), [sprites, actor?.sprite]);

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
    onValueChange?.(event);
  }, [event, onValueChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Actor</Text>
        <Select.Root
          value={event.actor || ''}
          onValueChange={onValueChange_.bind(null, 'actor')}
        >
          <Select.Trigger placeholder="Select" />
          <Select.Content>
            { scene?.actors?.map(actor => (
              <Select.Item key={actor.id} value={actor.id}>
                { actor.name }
              </Select.Item>
            )) }
          </Select.Content>
        </Select.Root>
      </div>
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
        <Text size="1" className="text-slate">Speed</Text>
        <EventValueField
          type="number"
          value={event.speed}
          onValueChange={onValueChange_.bind(null, 'speed')}
          placeholder="1"
        >
          <TextField.Slot side="right">tiles/s</TextField.Slot>
        </EventValueField>
      </div>
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
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Animation</Text>
        <Select.Root
          value={event.animation || ''}
          onValueChange={onValueChange_.bind(null, 'animation')}
        >
          <Select.Trigger placeholder="Select" />
          <Select.Content>
            { animations?.map(anim => (
              <Select.Item key={anim.id} value={anim.id}>
                { anim.name }
              </Select.Item>
            )) }
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  );
};

export default EventMoveActorTo;
