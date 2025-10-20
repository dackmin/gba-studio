import { useMemo } from 'react';
import { exists } from '@junipero/react';

import type {
  GameActor,
  GamePlayer,
  GameScene,
  GameSensor,
  GoToSceneEvent,
} from '../../../types';
import { tileToPixel } from '../../../helpers';
import { useApp, useCanvas } from '../../services/hooks';

export interface ArrowProps {
  source: GameScene | GameSensor | GameActor | GamePlayer;
  event: GoToSceneEvent;
  gridSize?: number;
  color?: string;
}

const Arrow = ({
  source,
  event,
  gridSize = 16,
  color = 'var(--accent-9)',
}: ArrowProps) => {
  const { project, scenes } = useApp();
  const { selectedScene } = useCanvas();

  const sourceType = useMemo(() => (
    (source as GameScene | GameActor | GameSensor).type
  ), [source]);

  const selectedSceneConfig = useMemo(() => (
    selectedScene ? project?.scenes?.find(s => (
      s.id === selectedScene?.id ||
      s._file === selectedScene?._file)
    ) : undefined
  ), [project, selectedScene]);

  const sourceConfig = useMemo(() => (
    sourceType === 'scene'
      ? project?.scenes?.find(s => (
        s.id === (source as GameScene).id ||
        s._file === (source as GameScene)._file)
      )
      : (source as GameActor | GameSensor | GamePlayer)
  ), [project, source, sourceType]);

  const start = useMemo(() => (
    sourceType === 'scene'
      ? {
        x: sourceConfig?.x ?? 0,
        y: sourceConfig?.y ?? 0,
      }
      : sourceType === 'sensor'
        ? {
          x: (selectedSceneConfig?.x ?? 0) +
            tileToPixel((source as GameSensor).x ?? 0, 16) + gridSize / 2,
          y: (selectedSceneConfig?.y ?? 0) +
            tileToPixel((source as GameSensor).y ?? 0, 16) + gridSize / 2,
        }
        : {
          x: tileToPixel((source as GameActor).x, 16) ?? 0,
          y: tileToPixel((source as GameActor).y, 16) ?? 0,
        }
  ), [
    source, gridSize,
    sourceType,
    selectedSceneConfig?.x, selectedSceneConfig?.y,
    sourceConfig?.x, sourceConfig?.y,
  ]);

  const targetConfig = useMemo(() => (
    project?.scenes?.find(s => (
      s.id === event.target ||
      s._file === event.target)
    )
  ), [project, event]);

  // Only retrieve scene when event start position is not defined
  const targetScene = useMemo(() => (
    !exists(event.start?.x) || !exists(event.start?.y) ? (
      scenes.find(s => (
        s.id === event.target ||
        s._file === event.target)
      )
    ) : undefined
  ), [scenes, event]);

  const targetPosition = useMemo(() => ({
    x: targetScene?.player?.x ??
      (typeof event.start?.x === 'number' ? event.start.x : 0) ?? 0,
    y: targetScene?.player?.y ??
      (typeof event.start?.y === 'number' ? event.start.y : 0) ?? 0,
  }), [event, targetScene]);

  const end = useMemo(() => ({
    x: (targetConfig?.x ?? 0) +
      tileToPixel(targetPosition.x, gridSize) - gridSize / 2,
    y: (targetConfig?.y ?? 0) +
      tileToPixel(targetPosition.y, gridSize) - gridSize / 2,
  }), [targetPosition, targetConfig?.x, targetConfig?.y, gridSize]);

  return (
    <svg
      className="absolute top-0 left-0 z-1000 w-px h-px pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="0"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={color} />
        </marker>
      </defs>
      <path
        d={
          // Start
          `M ${start.x} ${start.y} ` +
          // Bezier start control point
          `C ${start.x + (start.x > end.x ? -50 : 50)} ` +
            `${start.y - 50}, ` +
          // Bezier end control point
          `${end.x + (end.x > start.x ? -50 : 50)} ` +
          `${end.y - 50}, ` +
          // End
          `${end.x} ${end.y}`
        }
        stroke={color}
        strokeWidth="2"
        fill="transparent"
        markerEnd="url(#arrowhead)"
        strokeDasharray={gridSize}
      />
    </svg>
  );
};

export default Arrow;
