import {
  type ComponentPropsWithoutRef,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  type MoveableState,
  Moveable,
  classNames,
  useInfiniteCanvas,
} from '@junipero/react';
import { Card } from '@radix-ui/themes';

import type { GameScene, GameSensor } from '../../../types';
import { useApp, useCanvas } from '../../services/hooks';
import { getImageSize, pixelToTile, tileToPixel } from '../../../helpers';

export interface SceneProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'onSelect' | 'onChange'> {
  scene: GameScene;
  onChange?: (scene: GameScene) => void;
  onSelect?: (scene: GameScene) => void;
  onSelectSensor?: (scene: GameScene, sensor: GameSensor) => void;
  onMove?: (scene: GameScene, e: MoveableState) => void;
}

const Scene = ({
  scene,
  className,
  onChange,
  onSelect,
  onSelectSensor,
  onMove,
}: SceneProps) => {
  const { zoom } = useInfiniteCanvas();
  const { projectBase, project } = useApp();
  const { selectedScene, selectedItem, tool } = useCanvas();
  const [size, setSize] = useState([240, 160]);

  const sceneConfig = useMemo(() => (
    project?.scenes?.find(s => s._file === scene._file)
  ), [project, scene]);

  const backgroundPath = useMemo(() => scene.background ? (
    `project://graphics/${scene.background}.bmp`
  ) : '', [projectBase, scene.background]);

  const updateSize = useCallback(async () => {
    if (scene.map) {
      setSize([
        Math.max(240, (scene.map.width || 0) * (scene.map.gridSize || 16)),
        Math.max(160, (scene.map.height || 0) * (scene.map.gridSize || 16)),
      ]);

      return;
    }

    try {
      const [width, height] = await getImageSize(backgroundPath);
      setSize([Math.max(240, width), Math.max(160, height)]);
    } catch {
      setSize([240, 160]);
    }
  }, [backgroundPath, scene.map]);

  useEffect(() => {
    updateSize();
  }, [updateSize]);

  const collisions = useMemo(() => (
    scene.map?.collisions?.map(line => line.split(','))
  ), [scene]);

  const sensors = useMemo(() => (
    scene.map?.sensors || []
  ), [scene]);

  const gridSize = useMemo(() => (
    scene.map?.gridSize || 16
  ), [scene]);

  const onSelect_ = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(scene);
  }, [onSelect, scene, selectedScene]);

  const onMovedScene = useCallback((e: MoveableState) => {
    onMove?.(scene, e);
  }, [onChange, scene]);

  const onMovedSensor = useCallback((sensor: GameSensor, e: MoveableState) => {
    sensor.x = pixelToTile(e.deltaX, gridSize);
    sensor.y = pixelToTile(e.deltaY, gridSize);
    onChange?.(scene);
  }, [onChange, scene, gridSize]);

  const onSelectSensor_ = useCallback((
    sensor: GameSensor,
    e: MouseEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectSensor?.(scene, sensor);
  }, [onSelectSensor, scene]);

  return (
    <Moveable
      onMouseDown={onSelect_}
      onMoveEnd={onMovedScene}
      transformScale={zoom}
      x={sceneConfig?.x || 0}
      y={sceneConfig?.y || 0}
      disabled={tool !== 'move' || selectedScene !== scene || !!selectedItem}
    >
      <div
        className={classNames(
          'relative select-none',
          { 'z-100' : selectedScene === scene },
        )}
      >
        <Card
          className={classNames(
            '!relative bg-cover bg-center transition-[outline-width]',
            'duration-200',
            { '!outline-4 !outline-(--accent-9)': selectedScene === scene },
            className
          )}
          style={{
            backgroundImage: `url(${backgroundPath})`,
            contain: 'none',
            imageRendering: 'pixelated',
            width: size[0],
            height: size[1],
          }}
        >
          { collisions?.map((line, y) => (
            line.map((cell, x) => (
              cell === '1' && (
                <div
                  key={`${x}-${y}`}
                  className="absolute bg-red-500/50 pointer-events-none"
                  style={{
                    left: x * gridSize,
                    top: y * gridSize,
                    width: gridSize,
                    height: gridSize,
                  }}
                />
              )
            ))
          )) }

          { sensors.map((sensor, i) => (
            <Moveable
              key={i}
              transformScale={zoom}
              disabled={tool !== 'move' || selectedItem !== sensor}
              x={tileToPixel(sensor.x || 0, gridSize)}
              y={tileToPixel(sensor.y || 0, gridSize)}
              onMouseDown={e => e.stopPropagation()}
              onMoveEnd={onMovedSensor.bind(null, sensor)}
              step={gridSize}
              style={{
                left: 0,
                top: 0,
                width: tileToPixel(sensor.width || 1, gridSize),
                height: tileToPixel(sensor.height || 1, gridSize),
              }}
            >
              <div
                key={i}
                className={classNames(
                  'absolute bg-orange-500/50 border-2',
                  'border-orange-500',
                  { 'bg-yellow-500': selectedItem === sensor}
                )}
                onClick={onSelectSensor_.bind(null, sensor)}
              />
            </Moveable>
          )) }
        </Card>
        <span className="absolute block w-full left-0 bottom-full text-center">
          { scene.name }
        </span>
      </div>
    </Moveable>
  );
};

export default Scene;
