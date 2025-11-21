import {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import {
  type MoveableState,
  type MoveableProps,
  Moveable,
  classNames,
  mockState,
  useInfiniteCanvas,
  useEventListener,
} from '@junipero/react';
import { Card } from '@radix-ui/themes';

import type {
  GameActor,
  GamePlayer,
  GameScene,
  GameSensor,
  GameSprite,
} from '../../../types';
import { useApp, useCanvas, useEditor } from '../../services/hooks';
import { getImageSize, loadImage, pixelToTile, tileToPixel } from '../../../helpers';
import Actor from './Actor';
import Sensor from './Sensor';
import PlayerStart from './PlayerStart';
import Sprite from './Sprite';

export interface SceneProps
  extends Omit<MoveableProps, 'onSelect' | 'onChange'> {
  scene: GameScene;
  preview?: boolean;
  onChange?: (scene: GameScene) => void;
  onSelect?: (scene: GameScene) => void;
  onSelectItem?: (
    scene?: GameScene,
    item?: GameActor | GameSensor | GamePlayer | GameSprite
  ) => void;
  onMove?: (scene: GameScene, e: MoveableState) => void;
}

export interface SceneState {
  size: [number, number];
  isMouseDown: boolean;
  isMouseOver: boolean;
  cameraEnabled: boolean;
  cameraPosition: [number, number];
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
  const moveableRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLCanvasElement>(null);
  const backgroundImageRef = useRef<HTMLImageElement>(null);
  const { zoom, mouseX, offsetX, mouseY, offsetY } = useInfiniteCanvas();
  const { eventEmitter, project, backgrounds } = useApp();
  const { selectedScene, selectedItem, tool } = useCanvas();
  const { tileX, tileY, setTilePosition } = useEditor();
  const [state, dispatch] = useReducer(mockState<SceneState>, {
    size: [240, 160],
    isMouseDown: false,
    isMouseOver: false,
    cameraEnabled: false,
    cameraPosition: [0, 0],
  });

  useEventListener('scene:camera:set', (e: CustomEvent) => {
    if (!scene.id || e.detail.sceneId !== scene.id) {
      return;
    }

    dispatch({
      cameraEnabled: true,
      cameraPosition: [e.detail.x, e.detail.y],
    });
  }, [scene], { target: eventEmitter });

  useEventListener('scene:camera:reset', (e: CustomEvent) => {
    if (!scene.id || e.detail.sceneId !== scene.id || !state.cameraEnabled) {
      return;
    }

    dispatch({
      cameraEnabled: false,
      cameraPosition: [0, 0],
    });
  }, [scene, state.cameraEnabled], { target: eventEmitter });

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
    !background?._file || !scene.background || scene.background === 'bg_default'
      ? `resources://public/templates/` +
        `commons/graphics/bg_default.bmp`
      : `project://graphics/${scene.background}.bmp`
  ), [scene.background, background?._file]);

  const updateSize = useCallback(async () => {
    try {
      const [width, height] = await getImageSize(backgroundPath);
      backgroundImageRef.current = null;

      dispatch({ size: [Math.max(240, width), Math.max(160, height)] });
    } catch {
      dispatch({ size: [240, 160] });
    }
  }, [backgroundPath]);

  useEffect(() => {
    updateSize();
  }, [updateSize]);

  const sensors = useMemo(() => (
    scene.map?.sensors || []
  ), [scene.map?.sensors]);

  const actors = useMemo(() => (
    scene.actors || []
  ), [scene.actors]);

  const sprites = useMemo(() => (
    scene.sprites || []
  ), [scene.sprites]);

  const gridSize = useMemo(() => (
    scene.map?.gridSize || 16
  ), [scene]);

  const tileWidth = useMemo(() => (
    Math.ceil(state.size[0] / gridSize)
  ), [state.size, gridSize]);

  const tileHeight = useMemo(() => (
    Math.ceil(state.size[1] / gridSize)
  ), [state.size, gridSize]);

  const drawBackground = useCallback(async () => {
    const canvas = backgroundRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    if (!backgroundImageRef.current) {
      backgroundImageRef.current = await loadImage(backgroundPath);
    }

    canvas.width = state.size[0];
    canvas.height = state.size[1];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      backgroundImageRef.current, 0, 0, canvas.width, canvas.height);

    if (
      (scene.map?.collisions?.length || 0) > 0 &&
      scene.sceneType === '2d-top-down'
    ) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';

      scene.map?.collisions?.forEach((line, y) => {
        line.forEach((cell, x) => {
          if (cell === '1') {
            ctx.fillRect(
              x * gridSize,
              y * gridSize,
              gridSize,
              gridSize
            );
          }
        });
      });
    }

    // Draw mouse helper
    if (state.isMouseOver) {
      ctx.fillStyle = 'rgba(187, 187, 187, 0.5)';

      ctx.fillRect(
        tileToPixel(tileX || 0, gridSize),
        tileToPixel(tileY || 0, gridSize),
        gridSize,
        gridSize,
      );
    }
  }, [
    backgroundPath, gridSize, tileX, tileY,
    scene,
    state.size, state.isMouseOver,
  ]);

  useEffect(() => {
    requestAnimationFrame(drawBackground);
  }, [drawBackground, state.size, zoom]);

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

  const onMovedSprite = useCallback((sprite: GameSprite, e: MoveableState) => {
    sprite.x = pixelToTile(e.deltaX, gridSize);
    sprite.y = pixelToTile(e.deltaY, gridSize);
    onChange?.(scene);
  }, [onChange, scene, gridSize]);

  const onSelectSprite_ = useCallback((
    sprite: GameSprite,
    e: MouseEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectItem?.(scene, sprite);
  }, [onSelectItem, scene]);

  const checkCollisionsArray = useCallback(() => {
    if (!scene.map) {
      scene.map = {
        type: 'map',
        width: tileWidth,
        height: tileHeight,
        gridSize,
      };
    }

    if (!scene.map.collisions) {
      scene.map.collisions = [];
    }

    if (!scene.map.gridSize) {
      scene.map.gridSize = gridSize;
    }

    const c = scene.map.collisions;

    // Ensure correct height
    while (c.length < tileHeight) {
      c.push(new Array(tileWidth).fill('0'));
    }

    while (c.length > tileHeight) {
      c.pop();
    }

    // Ensure correct width
    for (let y = 0; y < c.length; y++) {
      while (c[y].length < tileWidth) {
        c[y].push('0');
      }

      while (c[y].length > tileWidth) {
        c[y].pop();
      }
    }

    return c;
  }, [tileWidth, tileHeight, gridSize, scene]);

  const onMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const realMouseX = (e.clientX - offsetX) / zoom;
    const realMouseY = (e.clientY - offsetY) / zoom;
    const x = pixelToTile((realMouseX - (sceneConfig?.x ?? 0)), gridSize);
    const y = pixelToTile((realMouseY - (sceneConfig?.y ?? 0)), gridSize);

    setTilePosition(x, y);

    if (state.isMouseDown && scene.map && tool === 'collisions') {
      const c = checkCollisionsArray();

      if (
        y < 0 ||
        y >= tileHeight ||
        x < 0 ||
        x >= tileWidth
      ) {
        return;
      }

      // mousemove uses .buttons because it does not have a source button
      // and uses active buttons during the event
      c[y][x] = e.buttons === 1 // Left button
        ? '1'
        : e.buttons === 2 // Right button
          ? '0'
          : c[y][x];

      if (!scene.map?.width) {
        scene.map!.width = tileWidth;
      }

      if (!scene.map?.height) {
        scene.map!.height = tileHeight;
      }

      requestAnimationFrame(drawBackground);
      onChange?.(scene);
    }
  }, [
    offsetX, offsetY, zoom, gridSize, sceneConfig, tool, tileWidth, tileHeight,
    setTilePosition, onChange, checkCollisionsArray, drawBackground,
    state.isMouseDown,
    scene,
  ]);

  const onMouseEnter = useCallback(() => {
    dispatch({ isMouseOver: true });
  }, []);

  const onMouseOut = useCallback(() => {
    setTilePosition();
    dispatch({ isMouseOver: false });
  }, [setTilePosition]);

  const onMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (tool !== 'collisions') {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    dispatch({ isMouseDown: true });

    const realMouseX = (e.clientX - offsetX) / zoom;
    const realMouseY = (e.clientY - offsetY) / zoom;

    const x = pixelToTile((realMouseX - (sceneConfig?.x ?? 0)), gridSize);
    const y = pixelToTile((realMouseY - (sceneConfig?.y ?? 0)), gridSize);
    const c = checkCollisionsArray();

    if (
      y < 0 ||
      y >= tileHeight ||
      x < 0 ||
      x >= tileWidth
    ) {
      return;
    }

    c[y][x] = e.button === 0 // Left button
      ? '1'
      : e.button === 2 // Right button
        ? '0'
        : c[y][x];

    if (!scene.map?.width) {
      scene.map!.width = tileWidth;
    }

    if (!scene.map?.height) {
      scene.map!.height = tileHeight;
    }

    requestAnimationFrame(drawBackground);
    onChange?.(scene);
  }, [
    gridSize, offsetX, offsetY, sceneConfig, tool, zoom, tileHeight, tileWidth,
    onChange, checkCollisionsArray, drawBackground,
    scene,
  ]);

  useEventListener('mouseup', () => {
    if (!state.isMouseDown) {
      return;
    }

    dispatch({ isMouseDown: false });
  }, [state.isMouseDown]);

  return (
    <Moveable
      { ...rest }
      ref={moveableRef}
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
            'duration-200 overflow-hidden group',
            { '!outline-4 !outline-(--accent-9)': selectedScene === scene },
            className
          )}
          style={{
            width: state.size[0],
            height: state.size[1],
          }}
          onMouseOver={onMouseEnter}
          onMouseMove={onMouseMove}
          onMouseOut={onMouseOut}
          onMouseDown={onMouseDown}
        >
          <canvas
            ref={backgroundRef}
            width={state.size[0]}
            height={state.size[1]}
            className={classNames(
              'absolute left-0 top-0 pointer-events-none w-full h-full z-0',
              'pixelated',
            )}
          />

          { state.cameraEnabled && (
            <div
              className={classNames(
                'absolute z-100 w-[240px] h-[160px] border-2',
                'border-yellow-500 pointer-events-none',
              )}
              style={{
                left: tileToPixel(state.cameraPosition[0], gridSize),
                top: tileToPixel(state.cameraPosition[1], gridSize),
                boxShadow: '0 0 0 10000px rgba(0, 0, 0, 0.25)',
              }}
            />
          )}

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

          { sprites.map((sprite, i) => (
            <Sprite
              key={i}
              sprite={sprite}
              gridSize={gridSize}
              onMoveEnd={onMovedSprite.bind(null, sprite)}
              onSelect={onSelectSprite_.bind(null, sprite)}
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
