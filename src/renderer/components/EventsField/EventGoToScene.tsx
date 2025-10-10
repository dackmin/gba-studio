import { set } from '@junipero/react';
import { Select, Text } from '@radix-ui/themes';

import type { GoToSceneEvent } from '../../../types';
import { useApp } from '../../services/hooks';
import EventValueField from '../EventValueField';
import DirectionField from '../DirectionField';

export interface EventGoToSceneProps {
  event: GoToSceneEvent;
  onValueChange?: (
    event: GoToSceneEvent,
  ) => void;
}

const EventGoToScene = ({
  event,
  onValueChange,
}: EventGoToSceneProps) => {
  const { scenes } = useApp();

  const onValueChange_ = (name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Scene</Text>
        <Select.Root
          value={event.target}
          onValueChange={onValueChange_.bind(null, 'target')}
        >
          <Select.Trigger placeholder="Select" />
          <Select.Content>
            { scenes.map(scene => (
              <Select.Item
                key={scene.id || scene._file}
                value={scene.id}
              >
                { scene.name }
              </Select.Item>
            )) }
          </Select.Content>
        </Select.Root>
      </div>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-2">
            <Text size="1" className="text-slate">X</Text>
            <EventValueField
              type="number"
              value={event.start?.x ?? 0}
              onValueChange={onValueChange_.bind(null, 'start.x')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Text size="1" className="text-slate">Y</Text>
            <EventValueField
              type="number"
              value={event.start?.y ?? 0}
              onValueChange={onValueChange_.bind(null, 'start.y')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Text size="1" className="text-slate">Direction</Text>
            <DirectionField
              value={event.start?.direction ?? 'down'}
              onValueChange={onValueChange_.bind(null, 'start.direction')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventGoToScene;
