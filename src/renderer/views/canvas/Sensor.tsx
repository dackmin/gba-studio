import { type MouseEvent, useCallback, useMemo } from 'react';
import {
  type MoveableProps,
  Moveable,
  classNames,
  useInfiniteCanvas,
} from '@junipero/react';
import { ContextMenu } from '@radix-ui/themes';

import type { GameSensor } from '../../../types';
import { tileToPixel } from '../../../helpers';
import { useCanvas } from '../../services/hooks';

export interface SensorProps extends MoveableProps {
  sensor: GameSensor;
  gridSize?: number;
  preview?: boolean;
  onSelect?: (e: MouseEvent<HTMLElement>) => void;
  onDelete?: () => void;
}

const Sensor = ({
  sensor,
  gridSize = 16,
  preview = false,
  onMoveEnd,
  onSelect,
  onDelete,
  ...rest
}: SensorProps) => {
  const { zoom, mouseX, mouseY, offsetX, offsetY } = useInfiniteCanvas();
  const { tool, selectedItem } = useCanvas();

  const onSelect_ = useCallback((e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    onSelect?.(e);
  }, [onSelect]);

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
      onMouseDown={onSelect_}
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
      >
        <ContextMenu.Root>
          <ContextMenu.Trigger>
            <div className="w-full h-full" />
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Label className="text-xs!">Sensor</ContextMenu.Label>
            <ContextMenu.Item
              onClick={onDelete}
              shortcut={window.electron.isDarwin ? '⌦' : 'Del'}
            >
              Delete
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
      </div>
    </Moveable>
  );
};

export default Sensor;
