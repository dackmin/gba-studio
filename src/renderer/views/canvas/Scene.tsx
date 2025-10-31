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

import type { GameActor, GamePlayer, GameScene, GameSensor } from '../../../types';
import { useApp, useCanvas } from '../../services/hooks';
import { getImageSize, pixelToTile, tileToPixel } from '../../../helpers';
import Sprite from '../../components/Sprite';

export interface SceneProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'onSelect' | 'onChange'> {
  scene: GameScene;
  preview?: boolean;
  onChange?: (scene: GameScene) => void;
  onSelect?: (scene: GameScene) => void;
  onSelectItem?: (
    scene?: GameScene,
    item?: GameActor | GameSensor | GamePlayer
  ) => void;
  onMove?: (scene: GameScene, e: MoveableState) => void;
}

const Scene = ({
  scene,
  className,
  preview = false,
  onChange,
  onSelect,
  onSelectItem,
  onMove,
}: SceneProps) => {
  const { zoom, mouseX, mouseY } = useInfiniteCanvas();
  const { projectBase, project, sprites } = useApp();
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
  ), [scene.map?.collisions]);

  const sensors = useMemo(() => (
    scene.map?.sensors || []
  ), [scene.map?.sensors]);

  const actors = useMemo(() => (
    scene.actors || []
  ), [scene.actors]);

  const gridSize = useMemo(() => (
    scene.map?.gridSize || 16
  ), [scene]);

  const onSelect_ = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(scene);
  }, [onSelect, scene, selectedScene]);

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
    onSelectItem?.(scene, sensor);
  }, [onSelectItem, scene]);

  const onSelectPlayer = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectItem?.(scene, scene.player);
  }, [onSelectItem, scene, scene.player]);

  const onMovedActor = useCallback((actor: GameActor, e: MoveableState) => {
    actor.x = pixelToTile(e.deltaX, gridSize);
    actor.y = pixelToTile(e.deltaY, gridSize);
    onChange?.(scene);
  }, [onChange, scene, gridSize]);

  const onSelectActor_ = useCallback((
    actor: GameActor,
    e: MouseEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectItem?.(scene, actor);
  }, [onSelectItem, scene]);

  const onMovedPlayer = useCallback((e: MoveableState) => {
    scene.player = scene.player || { type: 'player', x: 0, y: 0 };

    scene.player.x = pixelToTile(e.deltaX, gridSize);
    scene.player.y = pixelToTile(e.deltaY, gridSize);
    onChange?.(scene);
  }, [onChange, scene, gridSize]);

  const getSprite = useCallback((name: string) => (
    sprites?.find(s => s._file === `${name}.json`)
  ), [sprites]);

  return (
    <Moveable
      onMouseDown={onSelect_}
      onMove={onMove?.bind(null, scene)}
      transformScale={preview ? 1 : zoom}
      strategy="position"
      x={sceneConfig?.x || 0}
      y={sceneConfig?.y || 0}
      disabled={
        tool !== 'default' || selectedScene !== scene ||
        !!selectedItem
      }
      style={preview ? {
        position: 'fixed',
        left: mouseX,
        top: mouseY,
        transform: `scale(${zoom})`,
        transformOrigin: '0 0',
      } : undefined}
    >
      <div
        className={classNames(
          '!absolute select-none',
          { 'z-100' : selectedScene === scene },
        )}
      >
        <span className="absolute block w-full left-0 bottom-full text-center">
          { scene.name } { tool }
        </span>
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
              disabled={tool !== 'default' || selectedItem !== sensor}
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

          { actors.map((actor, i) => (
            <Moveable
              key={i}
              transformScale={zoom}
              disabled={tool !== 'default' || selectedItem !== actor}
              x={tileToPixel(actor.x || 0, gridSize)}
              y={tileToPixel(actor.y || 0, gridSize)}
              onMouseDown={e => e.stopPropagation()}
              onMoveEnd={onMovedActor.bind(null, actor)}
              step={gridSize}
              style={{
                left: 0,
                top: 0,
                width: actor.width
                  ? tileToPixel(actor.width, gridSize)
                  : getSprite(actor.sprite)?.width ?? gridSize,
                height: actor.height
                  ? tileToPixel(actor.height, gridSize)
                  : getSprite(actor.sprite)?.height ?? gridSize,
              }}
            >
              <div className="absolute w-full h-full">
                <div className="relative w-full h-full">
                  <div
                    className={classNames(
                      'absolute bg-pink-500/50 border-2',
                      'border-pink-500 z-2 w-full h-full top-0 left-0',
                      { 'bg-pink-500/70': selectedItem === actor }
                    )}
                    onClick={onSelectActor_.bind(null, actor)}
                  />
                  <Sprite
                    className="absolute z-1 top-0 left-0"
                    sprite={getSprite(actor.sprite)}
                    width={actor.width}
                    height={actor.height}
                    direction={actor.direction}
                    gridSize={gridSize}
                  />
                </div>
              </div>
            </Moveable>
          )) }

          { scene.sceneType === '2d-top-down' && scene.player && (
            <Moveable
              transformScale={zoom}
              x={tileToPixel(scene.player.x || 0, gridSize)}
              y={tileToPixel(scene.player.y || 0, gridSize)}
              disabled={tool !== 'default' || selectedItem !== scene.player}
              onMouseDown={e => e.stopPropagation()}
              onMoveEnd={onMovedPlayer}
              step={gridSize}
              style={{
                left: 0,
                top: 0,
                width: scene.player.width
                  ? tileToPixel(scene.player.width, gridSize)
                  : getSprite(scene.player.sprite || 'sprite_default')
                    ?.width ?? gridSize,
                height: scene.player.height
                  ? tileToPixel(scene.player.height, gridSize)
                  : getSprite(scene.player.sprite || 'sprite_default')
                    ?.height ?? gridSize,
              }}
            >
              <div
                className="absolute w-full h-full"
                onClick={onSelectPlayer}
              >
                <div className="relative w-full h-full">
                  <div
                    className={classNames(
                      'absolute bg-blue-500/50 border-2 border-blue-500',
                      'z-2 w-full h-full top-0 left-0',
                      { 'bg-blue-500/70': selectedItem === scene.player }
                    )}
                  />
                  <Sprite
                    className="absolute z-1 top-0 left-0"
                    sprite={getSprite(scene.player.sprite || 'sprite_default')}
                    width={scene.player.width}
                    height={scene.player.height}
                    direction={scene.player.direction}
                    gridSize={gridSize}
                  />
                </div>
              </div>
            </Moveable>
          ) }
        </Card>
      </div>
    </Moveable>
  );
};

export default Scene;
