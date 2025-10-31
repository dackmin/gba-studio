import { type MouseEvent, useCallback, useEffect, useRef } from 'react';
import {
  type InfiniteCanvasRef,
  type InfiniteCanvasCursorMode,
  InfiniteCanvas,
  classNames,
  set,
  useEventListener,
} from '@junipero/react';
import { useHotkeys } from 'react-hotkeys-hook';
import { v4 as uuid } from 'uuid';

import type { GameScene } from '../../../types';
import { useApp, useCanvas, useEditor } from '../../services/hooks';
import {
  DEFAULT_ACTOR,
  DEFAULT_SCENE,
  DEFAULT_SENSOR,
} from '../../services/defaults';
import { pixelToTile } from '../../../helpers';
import FullscreenView from '../../windows/editor/FullscreenView';
import Scene from './Scene';
import Toolbar from './Toolbar';
import Arrows from './Arrows';
import Actor from './Actor';
import Sensor from './Sensor';

const Canvas = () => {
  const infiniteCanvasRef = useRef<InfiniteCanvasRef>(null);
  const { bottomBarOpened, bottomBarHeight } = useEditor();
  const { project } = useApp();
  const { onCanvasChange, onMoveScene, ...appPayload } = useApp();
  const {
    selectedScene,
    selectedItem,
    tool,
    subTool,
    setTool,
    resetTool,
    selectItem,
    resetSelection,
    selectScene,
  } = useCanvas();

  useEffect(() => {
    infiniteCanvasRef.current?.fitIntoView(200);
  }, []);

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

  useHotkeys('delete, backspace', e => {
    e.preventDefault();
    e.stopPropagation();

    if (selectedItem?.type === 'sensor') {
      set(selectedScene, 'map.sensors',
        selectedScene?.map?.sensors
          ?.filter(s => s !== selectedItem) || []);
      onCanvasChange?.({
        ...appPayload,
        scenes: appPayload.scenes.map(s => (
          s.id === selectedScene?.id ||
          s._file === selectedScene?._file
            ? selectedScene! : s
        )),
      });
      selectItem?.();

      return;
    }

    if (selectedItem?.type === 'actor') {
      set(selectedScene, 'actors',
        selectedScene?.actors
          ?.filter(a => a !== selectedItem) || []);
      onCanvasChange?.({
        ...appPayload,
        scenes: appPayload.scenes.map(s => (
          s.id === selectedScene?.id ||
          s._file === selectedScene?._file
            ? selectedScene! : s
        )),
      });
      selectItem?.();

      return;
    }

    if (selectedScene) {
      onCanvasChange?.({
        ...appPayload,
        scenes: appPayload.scenes.filter(s => (
          s.id !== selectedScene?.id &&
          s._file !== selectedScene?._file
        )),
      });
      resetSelection?.();
    }
  }, [
    selectedScene, selectedItem, appPayload,
    onCanvasChange, selectItem, resetSelection,
  ]);

  const onSceneChange = useCallback((scene?: GameScene) => {
    onCanvasChange?.({
      ...appPayload,
      scenes: appPayload.scenes.map(s => (
        s.id === scene?.id || s._file === scene?._file ? scene! : s
      )),
    });
  }, [onCanvasChange, appPayload.scenes]);

  const onCanvasClick = useCallback(() => {
    if (tool === 'add' && subTool === 'scene') {
      const scene: GameScene = {
        ...DEFAULT_SCENE,
        id: uuid(),
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
        ...DEFAULT_ACTOR,
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

    if (tool === 'add' && subTool === 'sensor' && selectedScene) {
      const position = infiniteCanvasRef.current
        ?.getCursorPosition() || { x: 0, y: 0 };

      const sceneConfig = project?.scenes.find(s => (
        s.id === selectedScene.id || s._file === selectedScene._file
      ));

      const sensor = {
        ...DEFAULT_SENSOR,
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
    tool, appPayload, subTool, selectedScene, project,
    onCanvasChange, selectScene, onMoveScene, setTool, selectItem,
  ]);

  const onClickOutside = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.target !== infiniteCanvasRef.current?.innerRef.current) {
      return;
    }

    if (tool === 'add' && subTool !== 'scene') {
      return;
    }

    selectScene?.();
  }, [selectScene, tool, subTool]);

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
        onClick={onCanvasClick}
      >
        <div className="relative flex items-start gap-8">
          { appPayload.scenes.map(scene => (
            <Scene
              key={scene.name}
              scene={scene}
              onSelect={selectScene?.bind(null, scene)}
              onSelectItem={selectItem}
              onMove={onMoveScene}
              onChange={onSceneChange}
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

          <Arrows />
        </div>
      </InfiniteCanvas>

      <Toolbar
        className={classNames(
          '!fixed left-1/2 transform -translate-x-1/2 z-1000',
          { 'bottom-8': !bottomBarOpened }
        )}
        style={{
          ...bottomBarOpened && { bottom: 32 /* bottom-8 */ + bottomBarHeight },
        }}
        onSelectTool={setTool}
      />
    </FullscreenView>
  );
};

export default Canvas;

export { default as LeftSidebar } from './LeftSidebar';
export { default as RightSidebar } from './RightSidebar';
export { default as Provider } from './Provider';
