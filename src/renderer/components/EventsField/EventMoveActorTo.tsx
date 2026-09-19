import { useCallback, useEffect, useMemo, useState } from 'react';
import { set } from '@junipero/react';
import { Select, Switch, Text, TextField } from '@radix-ui/themes';

import type { MoveActorToEvent } from '../../../types';
import {
  findBackground,
  findSprite,
  getImageSize,
  pixelToTile,
  tileToPixel,
} from '../../../helpers';
import { useApp, useCanvas, useSceneForm } from '../../services/hooks';
import EventValueField from '../EventValueField';
import AnimationsListField from '../AnimationsListField';

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
  const { eventEmitter, backgrounds, sprites } = useApp();
  const { scene } = useSceneForm();
  const { selectedItem } = useCanvas();
  const [size, setSize] = useState([240, 160]);

  const background = useMemo(() => (
    findBackground(backgrounds, scene?.background)
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
        x: tileToPixel(typeof event.x === 'number' ? event.x : 0, scene?.map?.gridSize || 16),
        y: tileToPixel(typeof event.y === 'number' ? event.y : 0, scene?.map?.gridSize || 16),
        width: tileToPixel(actor?.width ?? 1, scene?.map?.gridSize || 16),
        height: tileToPixel(actor?.height ?? 1, scene?.map?.gridSize || 16),
        sceneId: scene?.id,
      });
    }

    onValueChange?.(event);
  }, [event, eventEmitter, scene, actor, onValueChange]);

  const onFocus = useCallback(() => {
    eventEmitter?.emit('scene:camera:set', {
      x: tileToPixel(typeof event.x === 'number' ? event.x : 0, scene?.map?.gridSize || 16),
      y: tileToPixel(typeof event.y === 'number' ? event.y : 0, scene?.map?.gridSize || 16),
      width: tileToPixel(actor?.width ?? 1, scene?.map?.gridSize || 16),
      height: tileToPixel(actor?.height ?? 1, scene?.map?.gridSize || 16),
      sceneId: scene?.id,
    });
  }, [eventEmitter, event.x, event.y, scene, actor]);

  const onBlur = useCallback(() => {
    eventEmitter?.emit('scene:camera:reset', {
      sceneId: scene?.id,
    });
  }, [eventEmitter, scene?.id]);

  const sprite = useMemo(() => (
    findSprite(sprites, actor?.sprite)
  ), [sprites, actor?.sprite]);

  return (
    <div
      className="flex flex-col gap-4"
      onMouseEnter={onFocus}
      onMouseLeave={onBlur}
    >
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
                { selectedItem?.type === 'actor' && selectedItem?.id === actor.id ? (
                  <Text size="1" className="text-slate"> (this actor)</Text>
                ) : '' }
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
          placeholder="2"
        >
          <TextField.Slot side="right">px/frame</TextField.Slot>
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
        <AnimationsListField
          sprite={sprite}
          value={event.animation || ''}
          onValueChange={onValueChange_.bind(null, 'animation')}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Backwards</Text>
        <Switch
          checked={!!event.backwards}
          onCheckedChange={onValueChange_.bind(null, 'backwards')}
        />
      </div>
    </div>
  );
};

export default EventMoveActorTo;
