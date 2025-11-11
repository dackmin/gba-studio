import { useMemo } from 'react';

import type { GameScene, GameSensor, GoToSceneEvent } from '../../../types';
import { useApp, useCanvas } from '../../services/hooks';
import { getEventsOfType } from '../../services/events';
import Arrow from './Arrow';

export interface ArrowsProps {
  gridSize?: number;
}

const Arrows = ({
  gridSize = 16,
}: ArrowsProps) => {
  const { scenes, scripts } = useApp();
  const { selectedScene } = useCanvas();

  const sceneArrows = useMemo<[GameScene, GoToSceneEvent[]][]>(() => (
    scenes
      .map<[GameScene, GoToSceneEvent[]]>(s => [
        s,
        getEventsOfType<
          GoToSceneEvent
        >('go-to-scene', s.events || [], { scripts }),
      ])
      .filter(([s, events]) => (
        (s.id === selectedScene?.id || s._file === selectedScene?._file) &&
        !!events.length
      ))
  ), [scenes, scripts, selectedScene]);

  const sensorArrows = useMemo(() => (
    selectedScene?.map?.sensors?.map<[GameSensor, GoToSceneEvent[]]>(sensor => [
      sensor,
      getEventsOfType<
        GoToSceneEvent
      >('go-to-scene', sensor.events || [], { scripts }),
    ]).filter(([_, events]) => !!events.length) || []
  ), [scripts, selectedScene]);

  return (
    <>
      { sceneArrows.map(([scene, events]) => events.map(e => (
        <Arrow
          key={(scene.id || scene._file) + '-' + e.id}
          source={scene}
          event={e}
          gridSize={scene.map?.gridSize || gridSize}
        />
      ))) }
      { sensorArrows.map(([sensor, events]) => events.map(e => (
        <Arrow
          key={sensor.id + '-' + e.id}
          source={sensor}
          event={e}
          gridSize={selectedScene?.map?.gridSize || gridSize}
          color="var(--orange-9)"
        />
      ))) }
    </>
  );
};

export default Arrows;
