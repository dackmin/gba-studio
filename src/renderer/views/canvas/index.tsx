import {
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  type InfiniteCanvasRef,
  type InfiniteCanvasCursorMode,
  InfiniteCanvas,
  classNames,
  set,
  cloneDeep,
  useEventListener,
  useTimeout,
} from '@junipero/react';
import { useHotkeys } from 'react-hotkeys-hook';
import { v4 as uuid } from 'uuid';

import type {
  GameActor,
  GameHud,
  GameHudSprite,
  GameHudText,
  GameScene,
  GameSensor,
  GameSprite,
} from '../../../types';
import {
  useApp,
  useBridgeListener,
  useCanvas,
  useEditor,
  useLocalData,
} from '../../services/hooks';
import {
  DEFAULT_ACTOR,
  DEFAULT_HUD,
  DEFAULT_HUD_SPRITE,
  DEFAULT_HUD_TEXT,
  DEFAULT_SCENE,
  DEFAULT_SENSOR,
  DEFAULT_SPRITE,
} from '../../services/defaults';
import { isEditableElementFocused } from '../../services/helpers';
import {
  duplicateActor,
  duplicateScene,
  duplicateSensor,
  duplicateSprite,
  pixelToTile,
} from '../../../helpers';
import FullscreenView from '../../windows/editor/FullscreenView';
import Scene from './Scene';
import Toolbar from './Toolbar';
// import Arrows from './Arrows';
import Actor from './Actor';
import Sensor from './Sensor';
import Sprite from './Sprite';
import Hud, { HUD_HEIGHT, HUD_WIDTH } from './Hud';
import HudSprite from './HudSprite';
import HudText from './HudText';

const Canvas = () => {
  const infiniteCanvasRef = useRef<InfiniteCanvasRef>(null);
  const scenesRefs = useRef<Record<string, HTMLDivElement>>({});
  const { getSize, isCollapsed, getData } = useLocalData();
  const { project, eventEmitter } = useApp();
  const { resizingSidebar } = useEditor();
  const { onCanvasChange, onMoveScene, onMoveHud, ...appPayload } = useApp();
  const {
    selectedScene,
    selectedHud,
    selectedItem,
    tool,
    subTool,
    setTool,
    resetTool,
    selectItem,
    resetSelection,
    selectScene,
    selectHud,
    selectHudItem,
    onHudChange,
  } = useCanvas();
  const bottomBarHeight = useMemo(() => getSize('bottomBarHeight', 300), [getSize]);

  useTimeout(() => {
    const storedSelectedScene = getData('canvas.selectedScene');

    if (storedSelectedScene) {
      infiniteCanvasRef.current?.centerOn(
        scenesRefs.current[storedSelectedScene],
      );
    }
  }, 100, []);

  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === ' ' && tool !== 'pan') {
      if (
        e.target &&
        (
          ['INPUT', 'TEXTAREA', 'SELECT']
            .includes((e.target as HTMLElement).nodeName) ||
          (e.target as HTMLElement).isContentEditable
        )
      ) {
        return;
      }

      setTool?.('pan');
    }
  }, [tool, setTool]);

  useEventListener('canvas:center', (e: CustomEvent<GameScene | GameHud>) => {
    const target = scenesRefs.current[e.detail?.id || ''] ?? undefined;

    if (target) {
      infiniteCanvasRef.current?.centerOn(target, 200);
    }
  }, [eventEmitter], { target: eventEmitter });

  useEventListener('keyup', (e: KeyboardEvent) => {
    if (e.key === ' ' && tool === 'pan') {
      if (
        e.target &&
        (
          ['INPUT', 'TEXTAREA', 'SELECT']
            .includes((e.target as HTMLElement).nodeName) ||
          (e.target as HTMLElement).isContentEditable
        )
      ) {
        return;
      }

      resetTool?.();
    }
  }, [resetTool, tool]);

  useHotkeys('escape', e => {
    e.preventDefault();
    e.stopPropagation();

    if (tool === 'add') {
      resetTool?.();
    }
  }, [tool, resetTool]);

  const onDeleteScene = useCallback((scene?: GameScene) => {
    if (!scene) {
      return;
    }

    onCanvasChange?.({
      ...appPayload,
      scenes: appPayload.scenes.filter(s => (
        s.id !== scene?.id &&
        s._file !== scene?._file
      )),
    });
    resetSelection?.();
  }, [appPayload, onCanvasChange, resetSelection]);

  const onDeleteActor = useCallback((scene: GameScene, actor: GameActor) => {
    set(scene, 'actors', scene?.actors?.filter(a => a.id !== actor.id) || []);
    onCanvasChange?.({
      ...appPayload,
      scenes: appPayload.scenes.map(s => (
        s.id === scene?.id ||
        s._file === scene?._file
          ? scene! : s
      )),
    });
    selectItem?.(scene);
  }, [appPayload, onCanvasChange, selectItem]);

  const onDeleteSensor = useCallback((scene: GameScene, sensor: GameSensor) => {
    set(scene, 'map.sensors', scene?.map?.sensors?.filter(s => s.id !== sensor.id) || []);
    onCanvasChange?.({
      ...appPayload,
      scenes: appPayload.scenes.map(s => (
        s.id === scene?.id ||
        s._file === scene?._file
          ? scene! : s
      )),
    });
    selectItem?.(scene);
  }, [appPayload, onCanvasChange, selectItem]);

  const onDeleteSprite = useCallback((scene: GameScene, sprite: GameSprite) => {
    set(scene, 'sprites', scene?.sprites?.filter(s => s.id !== sprite.id) || []);
    onCanvasChange?.({
      ...appPayload,
      scenes: appPayload.scenes.map(s => (
        s.id === scene?.id ||
        s._file === scene?._file
          ? scene! : s
      )),
    });
    selectItem?.(scene);
  }, [appPayload, onCanvasChange, selectItem]);

  const onDeleteHud = useCallback((hud?: GameHud) => {
    if (!hud) {
      return;
    }

    onCanvasChange?.({
      ...appPayload,
      huds: appPayload.huds.filter(h => h !== hud),
    });
    resetSelection?.();
  }, [appPayload, onCanvasChange, resetSelection]);

  const onDeleteHudItem = useCallback((
    hud: GameHud,
    item: GameHudSprite | GameHudText,
  ) => {
    if (item.type === 'hud-text') {
      set(hud, 'texts', hud.texts?.filter(t => t.id !== item.id) || []);
    } else {
      set(hud, 'sprites', hud.sprites?.filter(s => s.id !== item.id) || []);
    }

    onCanvasChange?.({
      ...appPayload,
      huds: appPayload.huds.map(h => h.id === hud.id ? hud : h),
    });
    selectHud?.(hud);
  }, [appPayload, onCanvasChange, selectHud]);

  useHotkeys('delete, backspace', e => {
    e.preventDefault();
    e.stopPropagation();

    if (selectedHud) {
      if (selectedItem?.type === 'hud-sprite' || selectedItem?.type === 'hud-text') {
        onDeleteHudItem?.(selectedHud, selectedItem);
      } else if (!selectedItem) {
        onDeleteHud?.(selectedHud);
      }

      return;
    }

    if (selectedItem?.type === 'player') {
      return;
    }

    if (selectedScene && selectedItem?.type === 'sensor') {
      onDeleteSensor?.(selectedScene, selectedItem);

      return;
    }

    if (selectedScene && selectedItem?.type === 'actor') {
      onDeleteActor?.(selectedScene, selectedItem);

      return;
    }

    if (selectedScene && selectedItem?.type === 'sprite') {
      onDeleteSprite?.(selectedScene, selectedItem);

      return;
    }

    if (selectedScene) {
      onDeleteScene?.(selectedScene);
    }
  }, [
    selectedScene, selectedItem, selectedHud, appPayload,
    onCanvasChange, selectItem, resetSelection,
    onDeleteScene, onDeleteActor, onDeleteSensor, onDeleteSprite,
    onDeleteHud, onDeleteHudItem,
  ]);

  const onCopy = useCallback((e?: globalThis.KeyboardEvent) => {
    if (isEditableElementFocused()) {
      return;
    }

    if (!selectedItem && selectedScene) {
      e?.preventDefault();
      e?.stopPropagation();

      window.electron.registerClipboard(selectedScene);

      return;
    }

    if (!['actor', 'sensor', 'sprite'].includes(selectedItem?.type || '')) {
      return;
    }

    e?.preventDefault();
    e?.stopPropagation();

    window.electron.registerClipboard(selectedItem);
  }, [selectedItem, selectedScene]);

  useBridgeListener('copy', onCopy, [onCopy]);

  const onPasteScene = useCallback((clipboardScene: GameScene) => {
    const scene = duplicateScene(appPayload.scenes, clipboardScene);
    const original = project?.scenes?.find(s => (
      s.id === clipboardScene.id || s._file === clipboardScene._file
    ));

    onCanvasChange?.({
      ...appPayload,
      scenes: [...appPayload.scenes, scene],
    });

    onMoveScene?.(scene, {
      deltaX: (original?.x || 0) + 40,
      deltaY: (original?.y || 0) + 40,
    });

    selectScene?.(scene);
  }, [appPayload, project, onCanvasChange, onMoveScene, selectScene]);

  const onPaste = useCallback(async (e?: globalThis.KeyboardEvent) => {
    if (isEditableElementFocused()) {
      return;
    }

    const clipboard = await window.electron.getClipboard();

    if (clipboard?.type === 'scene') {
      e?.preventDefault();
      e?.stopPropagation();
      onPasteScene(clipboard as GameScene);

      return;
    }

    if (!selectedScene || !['actor', 'sensor', 'sprite'].includes(clipboard?.type || '')) {
      return;
    }

    e?.preventDefault();
    e?.stopPropagation();

    let newItem: GameActor | GameSensor | GameSprite | undefined;

    switch (clipboard?.type) {
      case 'actor': {
        const clipboardActor = clipboard as GameActor;
        const duplicated = duplicateActor(selectedScene, clipboardActor);

        set(selectedScene, 'actors', [
          ...(selectedScene.actors || []),
          duplicated,
        ]);

        newItem = duplicated;

        break;
      }
      case 'sensor': {
        const clipboardSensor = clipboard as GameSensor;
        const duplicated = duplicateSensor(selectedScene, clipboardSensor);

        set(selectedScene, 'map.sensors', [
          ...(selectedScene.map?.sensors || []),
          duplicated,
        ]);

        newItem = duplicated;

        break;
      }
      case 'sprite': {
        const clipboardSprite = clipboard as GameSprite;
        const duplicated = duplicateSprite(selectedScene, clipboardSprite);

        set(selectedScene, 'sprites', [
          ...(selectedScene.sprites || []),
          duplicated,
        ]);

        newItem = duplicated;

        break;
      }
      default:
        break;
    }

    onCanvasChange?.({
      ...appPayload,
      scenes: appPayload.scenes.map(s => (
        s.id === selectedScene.id ||
        s._file === selectedScene._file
          ? selectedScene! : s
      )),
    });

    selectItem?.(selectedScene, newItem);
  }, [selectedScene, appPayload, onCanvasChange, selectItem, onPasteScene]);

  useBridgeListener('paste', onPaste, [onPaste]);

  const onCut = useCallback((e?: globalThis.KeyboardEvent) => {
    if (
      isEditableElementFocused() ||
      !selectedScene ||
      !['actor', 'sensor', 'sprite'].includes(selectedItem?.type || '')
    ) {
      return;
    }

    e?.preventDefault();
    e?.stopPropagation();

    window.electron.registerClipboard(selectedItem);

    switch (selectedItem?.type) {
      case 'actor':
        onDeleteActor?.(selectedScene, selectedItem);
        break;
      case 'sensor':
        onDeleteSensor?.(selectedScene, selectedItem);
        break;
      case 'sprite':
        onDeleteSprite?.(selectedScene, selectedItem);
        break;
      default:
        break;
    }
  }, [selectedScene, selectedItem, onDeleteActor, onDeleteSensor, onDeleteSprite]);

  useBridgeListener('cut', onCut, [onCut]);

  const onSceneChange = useCallback((scene?: GameScene) => {
    onCanvasChange?.({
      ...appPayload,
      scenes: appPayload.scenes.map(s => (
        s.id === scene?.id || s._file === scene?._file ? scene! : s
      )),
    });
  }, [onCanvasChange, appPayload]);

  const onCanvasClick = useCallback(() => {
    if (tool === 'add' && subTool === 'scene') {
      const scene: GameScene = {
        ...cloneDeep(DEFAULT_SCENE),
        id: uuid(),
        player: {
          type: 'player',
          x: 0,
          y: 0,
        },
        _file: `scene_${appPayload.scenes.length + 1}.json`,
        name: `Scene ${appPayload.scenes.length + 1}`,
      };

      onCanvasChange?.({
        ...appPayload,
        scenes: [...appPayload.scenes, scene],
      });

      const position = infiniteCanvasRef.current
        ?.getCursorPosition() || { x: 0, y: 0 };

      onMoveScene?.(scene, {
        deltaX: position.x,
        deltaY: position.y,
      });

      setTool?.('default');
      selectScene?.(scene);
    }

    if (tool === 'add' && subTool === 'actor' && selectedScene) {
      const position = infiniteCanvasRef.current
        ?.getCursorPosition() || { x: 0, y: 0 };

      const sceneConfig = project?.scenes.find(s => (
        s.id === selectedScene.id || s._file === selectedScene._file
      ));

      const actor = {
        ...cloneDeep(DEFAULT_ACTOR),
        id: uuid(),
        name: `Actor ${((selectedScene.actors?.length || 0) + 1)}`,
        x: pixelToTile(
          position.x - (sceneConfig?.x || 0),
          selectedScene.map?.gridSize || 16
        ),
        y: pixelToTile(
          position.y - (sceneConfig?.y || 0),
          selectedScene.map?.gridSize || 16
        ),
      };

      set(selectedScene, 'actors', [
        ...(selectedScene.actors || []),
        actor,
      ]);

      onCanvasChange?.({
        ...appPayload,
        scenes: appPayload.scenes.map(s => (
          s.id === selectedScene.id ||
          s._file === selectedScene._file
            ? selectedScene! : s
        )),
      });

      setTool?.('default');
      selectItem?.(selectedScene, actor);
    }

    if (tool === 'add' && subTool === 'sprite' && selectedScene) {
      const position = infiniteCanvasRef.current
        ?.getCursorPosition() || { x: 0, y: 0 };

      const sceneConfig = project?.scenes.find(s => (
        s.id === selectedScene.id || s._file === selectedScene._file
      ));

      const sprite = {
        ...cloneDeep(DEFAULT_SPRITE),
        id: uuid(),
        name: `Sprite ${((selectedScene.actors?.length || 0) + 1)}`,
        x: pixelToTile(
          position.x - (sceneConfig?.x || 0),
          selectedScene.map?.gridSize || 16
        ),
        y: pixelToTile(
          position.y - (sceneConfig?.y || 0),
          selectedScene.map?.gridSize || 16
        ),
      };

      set(selectedScene, 'sprites', [
        ...(selectedScene.sprites || []),
        sprite,
      ]);

      onCanvasChange?.({
        ...appPayload,
        scenes: appPayload.scenes.map(s => (
          s.id === selectedScene.id ||
          s._file === selectedScene._file
            ? selectedScene! : s
        )),
      });

      setTool?.('default');
      selectItem?.(selectedScene, sprite);
    }

    if (tool === 'add' && subTool === 'hud') {
      const hud: GameHud = {
        ...cloneDeep(DEFAULT_HUD),
        id: uuid(),
        _file: `hud_${appPayload.huds.length + 1}.json`,
        name: `HUD ${appPayload.huds.length + 1}`,
      };

      onCanvasChange?.({
        ...appPayload,
        huds: [...appPayload.huds, hud],
      });

      const position = infiniteCanvasRef.current
        ?.getCursorPosition() || { x: 0, y: 0 };

      onMoveHud?.(hud, {
        deltaX: position.x,
        deltaY: position.y,
      });

      setTool?.('default');
      selectHud?.(hud);
    }

    if (tool === 'add' && subTool === 'hud-sprite' && selectedHud) {
      const position = infiniteCanvasRef.current
        ?.getCursorPosition() || { x: 0, y: 0 };

      const hudConfig = project?.huds?.find(h => (
        h.id === selectedHud.id || h._file === selectedHud._file
      ));

      const sprite: GameHudSprite = {
        ...cloneDeep(DEFAULT_HUD_SPRITE),
        id: uuid(),
        name: `HUD Sprite ${((selectedHud.sprites?.length || 0) + 1)}`,
        x: Math.min(HUD_WIDTH - 1, Math.max(0,
          Math.round(position.x - (hudConfig?.x || 0)))),
        y: Math.min(HUD_HEIGHT - 1, Math.max(0,
          Math.round(position.y - (hudConfig?.y || 0)))),
      };

      set(selectedHud, 'sprites', [
        ...(selectedHud.sprites || []),
        sprite,
      ]);

      onCanvasChange?.({
        ...appPayload,
        huds: appPayload.huds.map(h => h.id === selectedHud.id ? selectedHud : h),
      });

      setTool?.('default');
      selectHudItem?.(selectedHud, sprite);
    }

    if (tool === 'add' && subTool === 'hud-text' && selectedHud) {
      const position = infiniteCanvasRef.current
        ?.getCursorPosition() || { x: 0, y: 0 };

      const hudConfig = project?.huds?.find(h => (
        h.id === selectedHud.id || h._file === selectedHud._file
      ));

      const text: GameHudText = {
        ...cloneDeep(DEFAULT_HUD_TEXT),
        id: uuid(),
        name: `HUD Text ${((selectedHud.texts?.length || 0) + 1)}`,
        x: Math.min(HUD_WIDTH - 1, Math.max(0,
          Math.round(position.x - (hudConfig?.x || 0)))),
        y: Math.min(HUD_HEIGHT - 1, Math.max(0,
          Math.round(position.y - (hudConfig?.y || 0)))),
      };

      set(selectedHud, 'texts', [
        ...(selectedHud.texts || []),
        text,
      ]);

      onCanvasChange?.({
        ...appPayload,
        huds: appPayload.huds.map(h => h.id === selectedHud.id ? selectedHud : h),
      });

      setTool?.('default');
      selectHudItem?.(selectedHud, text);
    }

    if (tool === 'add' && subTool === 'sensor' && selectedScene) {
      const position = infiniteCanvasRef.current
        ?.getCursorPosition() || { x: 0, y: 0 };

      const sceneConfig = project?.scenes.find(s => (
        s.id === selectedScene.id || s._file === selectedScene._file
      ));

      const sensor = {
        ...cloneDeep(DEFAULT_SENSOR),
        id: uuid(),
        name: `Sensor ${((selectedScene.map?.sensors?.length || 0) + 1)}`,
        x: pixelToTile(
          position.x - (sceneConfig?.x || 0),
          selectedScene.map?.gridSize || 16
        ),
        y: pixelToTile(
          position.y - (sceneConfig?.y || 0),
          selectedScene.map?.gridSize || 16
        ),
      };

      set(selectedScene, 'map.sensors', [
        ...(selectedScene.map?.sensors || []),
        sensor,
      ]);

      onCanvasChange?.({
        ...appPayload,
        scenes: appPayload.scenes.map(s => (
          s.id === selectedScene.id ||
          s._file === selectedScene._file
            ? selectedScene! : s
        )),
      });

      setTool?.('default');
      selectItem?.(selectedScene, sensor);
    }
  }, [
    tool, appPayload, subTool, selectedScene, selectedHud, project,
    onCanvasChange, selectScene, onMoveScene, setTool, selectItem,
    onMoveHud, selectHud, selectHudItem,
  ]);

  const onClickOutside = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.target !== infiniteCanvasRef.current?.innerRef.current) {
      return;
    }

    if (tool === 'add' && subTool !== 'scene' && subTool !== 'hud') {
      return;
    }

    selectScene?.();
  }, [selectScene, tool, subTool]);

  // const onZoom = useDelayedCallback((zoom: number) => {
  //   console.log('zoom changed to', zoom);
  //   setSize('canvas.zoom', zoom);
  // }, 500, [setSize]);

  // const onPan = useDelayedCallback((x: number, y: number) => {
  //   console.log('pan changed to', x, y);
  //   setSize('canvas.x', x);
  //   setSize('canvas.y', y);
  // }, 500, [setSize]);

  return (
    <FullscreenView onMouseDown={onClickOutside}>
      <InfiniteCanvas
        ref={infiniteCanvasRef}
        cursorMode={
          ['collisions'].includes(tool)
            ? 'default'
            : (tool || 'default') as InfiniteCanvasCursorMode
        }
        className={classNames(
          'flex-auto overflow-hidden !bg-transparent',
          {
            'cursor-grab active:cursor-grabbing': tool === 'pan',
            'cursor-copy': tool === 'add',
          },
        )}
        fitAbsolute={true}
        onClick={onCanvasClick}
        // initialZoom={getSize('canvas.zoom') || 1}
        // initialOffsetX={getSize('canvas.x') || 0}
        // initialOffsetY={getSize('canvas.y') || 0}
        padding={{
          left: !isCollapsed('leftSidebar') ? getSize('leftSidebarWidth') || 300 : 0,
          bottom: !isCollapsed('bottomBar') ? getSize('bottomBarHeight') || 300 : 0,
          right: !isCollapsed('rightSidebar') ? getSize('rightSidebarWidth') || 300 : 0,
        }}
        // onZoom={onZoom}
        // onPan={onPan}
      >
        { appPayload.scenes.map(scene => (
          <Scene
            ref={(r: HTMLDivElement) => { scenesRefs.current[scene.id] = r; }}
            key={scene.name}
            scene={scene}
            onSelect={selectScene?.bind(null, scene)}
            onSelectItem={selectItem}
            onMove={onMoveScene}
            onChange={onSceneChange}
            onDelete={onDeleteScene.bind(null, scene)}
            onDeleteActor={onDeleteActor.bind(null, scene)}
            onDeleteSensor={onDeleteSensor.bind(null, scene)}
            onDeleteSprite={onDeleteSprite?.bind(null, scene)}
          />
        )) }

        { appPayload.huds.map(hud => (
          <Hud
            ref={(r: HTMLDivElement) => { scenesRefs.current[hud.id] = r; }}
            key={hud.id}
            hud={hud}
            onSelect={selectHud}
            onSelectItem={selectHudItem}
            onMove={onMoveHud}
            onChange={onHudChange}
            onDelete={onDeleteHud}
            onDeleteItem={onDeleteHudItem.bind(null, hud)}
          />
        )) }

        { tool === 'add' && subTool === 'scene' && (
          <Scene
            scene={DEFAULT_SCENE}
            className="!fixed pointer-events-none opacity-50 !z-1000"
            preview={true}
          />
        ) }

        { tool === 'add' && subTool === 'actor' && (
          <Actor
            actor={DEFAULT_ACTOR}
            className="!fixed pointer-events-none opacity-50 !z-1000"
            preview={true}
            gridSize={selectedScene?.map?.gridSize}
          />
        ) }

        { tool === 'add' && subTool === 'sensor' && (
          <Sensor
            sensor={DEFAULT_SENSOR}
            className="!fixed pointer-events-none opacity-50 !z-1000"
            preview={true}
            gridSize={selectedScene?.map?.gridSize}
          />
        ) }

        { tool === 'add' && subTool === 'sprite' && (
          <Sprite
            sprite={DEFAULT_SPRITE}
            className="!fixed pointer-events-none opacity-50 !z-1000"
            preview={true}
            gridSize={selectedScene?.map?.gridSize}
          />
        ) }

        { tool === 'add' && subTool === 'hud' && (
          <Hud
            hud={DEFAULT_HUD}
            className="!fixed pointer-events-none opacity-50 !z-1000"
            preview={true}
          />
        ) }

        { tool === 'add' && subTool === 'hud-sprite' && selectedHud && (
          <HudSprite
            sprite={DEFAULT_HUD_SPRITE}
            className="!fixed pointer-events-none opacity-50 !z-1000"
            preview={true}
          />
        ) }

        { tool === 'add' && subTool === 'hud-text' && selectedHud && (
          <HudText
            item={DEFAULT_HUD_TEXT}
            className="!fixed pointer-events-none opacity-50 !z-1000"
            preview={true}
          />
        ) }

        {/* <Arrows /> */}
      </InfiniteCanvas>

      <Toolbar
        className={classNames(
          '!fixed left-1/2 transform -translate-x-1/2 z-1000',
          {
            'transition-[bottom] duration-100': !resizingSidebar,
            'bottom-8': isCollapsed('bottomBar'),
          },
        )}
        style={{
          ...!isCollapsed('bottomBar') && { bottom: 32 /* bottom-8 */ + bottomBarHeight },
        }}
        onSelectTool={setTool}
      />
    </FullscreenView>
  );
};

export default Canvas;

export { default as LeftSidebar } from './LeftSidebar';
export { default as RightSidebar } from './RightSidebar';
export { default as BottomBar } from './BottomBar';
export { default as Provider } from './Provider';
