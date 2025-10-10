import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import {
  type MoveableState,
  type InfiniteCanvasRef,
  type InfiniteCanvasCursorMode,
  InfiniteCanvas,
  classNames,
  mockState,
  useEventListener,
} from '@junipero/react';
import { useHotkeys } from 'react-hotkeys-hook';
import { v4 as uuid } from 'uuid';

import type {
  AppPayload,
  GameActor,
  GameScene,
  GameScript,
  GameSensor,
  GameVariables,
  ToolType,
} from '../../../types';
import { type CanvasContextType, CanvasContext } from '../../services/contexts';
import { useApp } from '../../services/hooks';
import Scene from './Scene';
import Toolbar from './Toolbar';
import TitleBar from './TitleBar';
import EditSidebar from './EditSidebar';
import ProjectSidebar from './ProjectSidebar';

export interface CanvasProps {
  onMoveScene: (scene: GameScene, e: Partial<MoveableState>) => void;
  onChange?: (payload: Partial<AppPayload>) => void;
}

export interface CanvasState {
  selectedScene?: string;
  selectedItem?: GameActor | GameSensor | GameScript;
  tool: ToolType;
  previousTool: ToolType;
}

const Canvas = ({
  onMoveScene,
  onChange,
}: CanvasProps) => {
  const infiniteCanvasRef = useRef<InfiniteCanvasRef>(null);
  const appPayload = useApp();
  const [state, dispatch] = useReducer(mockState<CanvasState>, {
    selectedScene: undefined,
    selectedItem: undefined,
    tool: 'default',
    previousTool: 'default',
  });

  const selectedScene = useMemo(() => (
    appPayload.scenes.find(s => s._file === state.selectedScene)
  ), [appPayload.scenes, state.selectedScene]);

  useEffect(() => {
    infiniteCanvasRef.current?.fitIntoView(200);
  }, []);

  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === ' ' && state.tool !== 'pan') {
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

      dispatch({ tool: 'pan', previousTool: state.tool });
    }
  }, [state.tool]);

  useEventListener('keyup', (e: KeyboardEvent) => {
    if (e.key === ' ' && state.tool === 'pan') {
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

      dispatch({ tool: state.previousTool });
    }
  }, [state.previousTool, state.tool]);

  useHotkeys('delete, backspace', e => {
    e.preventDefault();
    e.stopPropagation();

    if (state.selectedScene) {
      onChange?.({
        ...appPayload,
        scenes: appPayload.scenes.filter(s => s._file !== state.selectedScene),
      });
      dispatch({ selectedScene: undefined, selectedItem: undefined });
    }
  }, [state.selectedScene, appPayload, onChange]);

  const onSelectScene = useCallback((scene?: GameScene) => {
    if (selectedScene === scene) {
      dispatch({ selectedItem: undefined });

      return;
    }

    dispatch({ selectedScene: scene?._file, selectedItem: undefined });
  }, [selectedScene]);

  const onSelectSensor = useCallback((scene: GameScene, sensor: GameSensor) => {
    if (state.selectedItem === sensor) {
      return;
    }

    dispatch({ selectedScene: scene?._file, selectedItem: sensor });
  }, [state.selectedItem]);

  const onSelectScript = useCallback((script: GameScript) => {
    if (state.selectedItem === script) {
      return;
    }

    dispatch({ selectedItem: script, selectedScene: undefined });
  }, [state.selectedItem]);

  const onSelectTool = useCallback((tool: ToolType) => {
    dispatch({ tool });
  }, []);

  const onSceneChange = useCallback((scene?: GameScene) => {
    onChange?.({
      ...appPayload,
      scenes: appPayload.scenes.map(s => (
        s.id === scene?.id || s._file === scene?._file ? scene! : s
      )),
    });
  }, [onChange, appPayload.scenes]);

  const onCanvasClick = useCallback(() => {
    if (state.tool === 'add') {
      const scene: GameScene = {
        id: uuid(),
        _file: `scene_${appPayload.scenes.length + 1}.json`,
        name: `Scene ${appPayload.scenes.length + 1}`,
        background: 'bg_default',
        type: 'scene',
        sceneType: 'logos',
      };

      onChange?.({
        ...appPayload,
        scenes: [...appPayload.scenes, scene],
      });

      const position = infiniteCanvasRef.current
        ?.getCursorPosition() || { x: 0, y: 0 };

      onMoveScene(scene, {
        deltaX: position.x,
        deltaY: position.y,
      });

      dispatch({ tool: 'default', selectedScene: scene._file });
    }
  }, [state.tool, appPayload]);

  const onVariablesChange = useCallback((registry: GameVariables) => {
    onChange?.({
      ...appPayload,
      variables: appPayload
        .variables.map(v => v._file === registry._file ? registry : v),
    });
  }, [onChange, appPayload]);

  const onScriptsChange = useCallback((scripts: GameScript[]) => {
    onChange?.({
      ...appPayload,
      scripts,
    });
    dispatch({ selectedItem: scripts.find(s => s === state.selectedItem) });
  }, [onChange, appPayload]);

  const onScriptChange = useCallback((script: GameScript) => {
    onChange?.({
      ...appPayload,
      scripts: appPayload.scripts
        .map(s => s._file === script._file ? script : s),
    });
    dispatch({ selectedItem: script });
  }, [onChange, appPayload]);

  const getContext = useCallback((): CanvasContextType => ({
    selectedScene,
    selectedItem: state.selectedItem,
    tool: state.tool,
  }), [selectedScene, state.selectedItem, state.tool]);

  return (
    <CanvasContext.Provider value={getContext()}>
      <div
        className={classNames(
          'fixed w-screen h-screen top-0 left-0 pointer-events-none z-1000',
          'flex items-stretch',
        )}
      >
        <div
          className={classNames(
            'fixed top-0 left-0 w-screen h-[15px] app-drag',
            'pointer-events-auto'
          )}
        />
        <ProjectSidebar
          onSelectScene={onSelectScene}
          onSelectScript={onSelectScript}
          onVariablesChange={onVariablesChange}
          onScriptsChange={onScriptsChange}
        />
        <TitleBar />
        <EditSidebar
          onSceneChange={onSceneChange}
          onScriptChange={onScriptChange}
        />
      </div>
      <div
        className={classNames(
          'w-screen h-screen relative flex items-stretch overflow-hidden',
        )}
        onMouseDown={() => onSelectScene()}
      >
        <InfiniteCanvas
          ref={infiniteCanvasRef}
          cursorMode={
            ['collisions'].includes(state.tool)
              ? 'default'
              : (state.tool || 'default') as InfiniteCanvasCursorMode
          }
          className={classNames(
            'flex-auto overflow-hidden !bg-transparent',
            {
              'cursor-grab active:cursor-grabbing': state.tool === 'pan',
              'cursor-copy': state.tool === 'add',
            },
          )}
          onClick={onCanvasClick}
        >
          <div className="flex items-start gap-8">
            { appPayload.scenes.map(scene => (
              <Scene
                key={scene.name}
                scene={scene}
                onSelect={onSelectScene}
                onSelectSensor={onSelectSensor}
                onMove={onMoveScene}
                onChange={onSceneChange}
              />
            )) }
          </div>
        </InfiniteCanvas>

        <Toolbar
          className={classNames(
            '!fixed bottom-8 left-1/2 transform -translate-x-1/2 z-1000'
          )}
          onSelectTool={onSelectTool}
        />
      </div>
    </CanvasContext.Provider>
  );
};

export default Canvas;
