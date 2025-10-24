import { useCallback, useEffect, useRef } from 'react';
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
import FullscreenView from '../../windows/editor/FullscreenView';
import Scene from './Scene';
import Toolbar from './Toolbar';
import Arrows from './Arrows';

const Canvas = () => {
  const infiniteCanvasRef = useRef<InfiniteCanvasRef>(null);
  const { bottomBarOpened, bottomBarHeight } = useEditor();
  const { onCanvasChange, onMoveScene, ...appPayload } = useApp();
  const {
    selectedScene,
    selectedItem,
    tool,
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
    if (tool === 'add') {
      const scene: GameScene = {
        id: uuid(),
        _file: `scene_${appPayload.scenes.length + 1}.json`,
        name: `Scene ${appPayload.scenes.length + 1}`,
        background: 'bg_default',
        type: 'scene',
        sceneType: 'logos',
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
  }, [tool, appPayload]);

  return (
    <FullscreenView onMouseDown={() => selectScene?.()}>
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
