import { type MouseEvent, useMemo } from 'react';
import {
  type MoveableProps,
  Moveable,
  classNames,
  useInfiniteCanvas,
} from '@junipero/react';

import type { GameSensor } from '../../../types';
import { tileToPixel } from '../../../helpers';
import { useCanvas } from '../../services/hooks';

export interface SensorProps extends MoveableProps {
  sensor: GameSensor;
  gridSize?: number;
  preview?: boolean;
  onSelect?: (e: MouseEvent<HTMLDivElement>) => void;
}

const Sensor = ({
  sensor,
  gridSize = 16,
  preview = false,
  onMoveEnd,
  onSelect,
  ...rest
}: SensorProps) => {
  const { zoom, mouseX, mouseY, offsetX, offsetY } = useInfiniteCanvas();
  const { tool, selectedItem } = useCanvas();

  const previewPosition = useMemo(() => preview ? {
    x: Math.round((mouseX - offsetX) / zoom),
    y: Math.round((mouseY - offsetY) / zoom),
  } : null, [preview, mouseX, mouseY, offsetX, offsetY, zoom]);

  return (
    <Moveable
      { ...rest }
      transformScale={zoom}
      disabled={
        (tool === 'add' && !preview) ||
        tool !== 'default' || selectedItem !== sensor
      }
      x={preview ? previewPosition?.x : tileToPixel(sensor.x || 0, gridSize)}
      y={preview ? previewPosition?.y : tileToPixel(sensor.y || 0, gridSize)}
      onMouseDown={e => e.stopPropagation()}
      onMoveEnd={onMoveEnd}
      step={preview ? undefined : gridSize}
      style={{
        left: 0,
        top: 0,
        width: tileToPixel(sensor.width || 1, gridSize),
        height: tileToPixel(sensor.height || 1, gridSize),
      }}
    >
      <div
        className={classNames(
          'absolute bg-orange-500/50 hover:border-1 border-(--accent-9)',
          { 'border-1': selectedItem === sensor}
        )}
        onClick={onSelect}
      />
    </Moveable>
  );
};

export default Sensor;
