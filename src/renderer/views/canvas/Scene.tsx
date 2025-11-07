import {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import {
  type MoveableState,
  type MoveableProps,
  Moveable,
  classNames,
  mockState,
  useInfiniteCanvas,
} from '@junipero/react';
import { Card } from '@radix-ui/themes';

import type {
  GameActor,
  GamePlayer,
  GameScene,
  GameSensor,
} from '../../../types';
import { useApp, useCanvas, useEditor } from '../../services/hooks';
import { getImageSize, pixelToTile } from '../../../helpers';
import Actor from './Actor';
import Sensor from './Sensor';
import PlayerStart from './PlayerStart';

export interface SceneProps
  extends Omit<MoveableProps, 'onSelect' | 'onChange'> {
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

export interface SceneState {
  size: [number, number];
  isMouseDown: boolean;
}

const Scene = ({
  scene,
  className,
  preview = false,
  onChange,
  onSelect,
  onSelectItem,
  onMove,
  ...rest
}: SceneProps) => {
  const { zoom, mouseX, offsetX, mouseY, offsetY } = useInfiniteCanvas();
  const { project, resourcesPath, backgrounds } = useApp();
  const { selectedScene, selectedItem, tool } = useCanvas();
  const { setTilePosition } = useEditor();
  const [state, dispatch] = useReducer(mockState<SceneState>, {
    size: [240, 160],
    isMouseDown: false,
  });

  const sceneConfig = useMemo(() => (
    preview
      ? {
        x: Math.round((mouseX - offsetX) / zoom),
        y: Math.round((mouseY - offsetY) / zoom),
      }
      : project?.scenes?.find(s => s._file === scene._file)
  ), [project, mouseX, mouseY, offsetX, offsetY, zoom, scene, preview]);

  const background = useMemo(() => (
    backgrounds.find(bg => bg._file === scene.background + '.json')
  ), [backgrounds, scene.background]);

  const backgroundPath = useMemo(() => (
    !background?._file
      ? `file://${resourcesPath}/public/templates/` +
        `commons/graphics/bg_default.bmp`
      : `project://graphics/${scene.background}.bmp`
  ), [scene.background, background?._file, resourcesPath]);

  const updateSize = useCallback(async () => {
    try {
      const [width, height] = await getImageSize(backgroundPath);
      dispatch({ size: [Math.max(240, width), Math.max(160, height)] });
    } catch {
      dispatch({ size: [240, 160] });
    }
  }, [backgroundPath]);

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
  }, [onSelect, scene]);

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
  }, [onSelectItem, scene]);

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

  const applyCollision = useCallback((cell: string, button: number): string => {
    const buttonToValue: Record<number, '0' | '1'> = {
      1: '1', // Left button
      2: '0', // Right button
    };
    const value = buttonToValue[button];

    if (value === undefined || cell === value) {
      return cell;
    }

    return value;
  }, []);

  const onMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const realMouseX = (e.clientX - offsetX) / zoom;
    const realMouseY = (e.clientY - offsetY) / zoom;
    const x = pixelToTile((realMouseX - (sceneConfig?.x ?? 0)), gridSize);
    const y = pixelToTile((realMouseY - (sceneConfig?.y ?? 0)), gridSize);

    setTilePosition(x, y);

    if (state.isMouseDown && scene.map && tool === 'collisions') {
      const c = collisions;

      if (!c) {
        return;
      }

      if (
        y < 0 ||
        y >= c.length ||
        x < 0 ||
        x >= c[y]?.length
      ) {
        return;
      }

      const cell = applyCollision(c[y][x], e.buttons);

      if (cell === c[y][x]) {
        return;
      }

      c[y][x] = cell;

      scene.map.collisions = c.map(line => line.join(','));
      onChange?.(scene);
    }

  }, [
    offsetX, offsetY, zoom, gridSize, sceneConfig, setTilePosition,
    state.isMouseDown, scene, tool, onChange, collisions, applyCollision,
  ]);

  const onMouseOut = useCallback(() => {
    setTilePosition();
  }, [setTilePosition]);

  const onMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (tool !== 'collisions') {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    dispatch({ isMouseDown: true });

    if (!scene.map) {
      return;
    }

    const realMouseX = (e.clientX - offsetX) / zoom;
    const realMouseY = (e.clientY - offsetY) / zoom;

    const x = pixelToTile((realMouseX - (sceneConfig?.x ?? 0)), gridSize);
    const y = pixelToTile((realMouseY - (sceneConfig?.y ?? 0)), gridSize);

    const c = collisions;

    if (!c) {
      return;
    }

    if (
      y >= 0 && y < c.length &&
      x >= 0 && x < c[y]?.length
    ) {
      c[y][x] = applyCollision(c[y][x], e.button);
      scene.map.collisions = c.map(line => line.join(','));
    }

    onChange?.(scene);
  }, [
    collisions, gridSize, offsetX, offsetY, onChange,
    scene, sceneConfig, tool, zoom, applyCollision,
  ]);

  const onMouseUp = useCallback(() => {
    dispatch({ isMouseDown: false });
  }, []);

  return (
    <Moveable
      { ...rest }
      strategy="position"
      onMouseDown={onSelect_}
      onMove={onMove?.bind(null, scene)}
      transformScale={zoom}
      x={sceneConfig?.x || 0}
      y={sceneConfig?.y || 0}
      disabled={
        (tool === 'add' && preview) || tool !== 'default' ||
        selectedScene !== scene || !!selectedItem
      }
    >
      <div
        className={classNames(
          '!absolute select-none',
          { 'z-100' : selectedScene === scene },
        )}
      >
        <span className="absolute block w-full left-0 bottom-full text-center">
          { scene.name }
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
            width: state.size[0],
            height: state.size[1],
          }}
          onMouseMove={onMouseMove}
          onMouseOut={onMouseOut}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
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
            <Sensor
              key={i}
              sensor={sensor}
              onMoveEnd={onMovedSensor.bind(null, sensor)}
              onSelect={onSelectSensor_.bind(null, sensor)}
              gridSize={gridSize}
            />
          )) }

          { actors.map((actor, i) => (
            <Actor
              key={i}
              actor={actor}
              onMoveEnd={onMovedActor.bind(null, actor)}
              onSelect={onSelectActor_.bind(null, actor)}
              gridSize={gridSize}
            />
          )) }

          { scene.sceneType === '2d-top-down' && scene.player && (
            <PlayerStart
              scene={scene}
              onMouseDown={e => e.stopPropagation()}
              onMoveEnd={onMovedPlayer}
              onSelect={onSelectPlayer}
              gridSize={gridSize}
            />
          ) }
        </Card>
      </div>
    </Moveable>
  );
};

export default Scene;
