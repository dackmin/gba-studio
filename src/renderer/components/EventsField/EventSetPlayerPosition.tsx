import { useCallback, useEffect, useMemo, useState } from 'react';
import { set } from '@junipero/react';
import { Text } from '@radix-ui/themes';

import type { SetPlayerPositionEvent } from '../../../types';
import { findBackground, getImageSize, pixelToTile } from '../../../helpers';
import { useApp, useSceneForm } from '../../services/hooks';
import EventValueField from '../EventValueField';

export interface EventSetPlayerPositionProps {
  event: SetPlayerPositionEvent;
  onValueChange?: (
    event: SetPlayerPositionEvent,
  ) => void;
}

const EventSetPlayerPosition = ({
  event,
  onValueChange,
}: EventSetPlayerPositionProps) => {
  const { backgrounds } = useApp();
  const { scene } = useSceneForm();
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
    </div>
  );
};

export default EventSetPlayerPosition;
