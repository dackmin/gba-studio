import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  type MoveableState,
  type InfiniteCanvasRef,
  InfiniteCanvas,
  classNames,
  mockState,
  useEventListener,
} from '@junipero/react';
import { Resizable } from 're-resizable';

import type { GameActor, GameScene, GameSensor, ToolType } from '../../../types';
import { type CanvasContextType, CanvasContext } from '../../services/contexts';
import { useApp } from '../../services/hooks';
import Scene from '../../components/Scene';
import Toolbar from './Toolbar';
import TitleBar from './TitleBar';
import Sidebar from './Sidebar';

export interface CanvasProps {
  onMoveScene: (scene: GameScene, e: MoveableState) => void;
  onChange?: (scenes: GameScene[]) => void;
}

export interface CanvasState {
  selectedScene?: GameScene;
  selectedItem?: GameActor | GameSensor;
  tool: ToolType;
  previousTool: ToolType;
}

const Canvas = ({
  onMoveScene,
  onChange,
}: CanvasProps) => {
  const infiniteCanvasRef = useRef<InfiniteCanvasRef>(null);
  const { scenes } = useApp();
  const [state, dispatch] = useReducer(mockState<CanvasState>, {
    selectedScene: undefined,
    selectedItem: undefined,
    tool: 'move',
    previousTool: 'move',
  });

  useEffect(() => {
    infiniteCanvasRef.current?.fitIntoView(200);
  }, []);

  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === ' ' && state.tool !== 'pan') {
      dispatch({ tool: 'pan', previousTool: state.tool });
    }
  }, [state.tool]);

  useEventListener('keyup', (e: KeyboardEvent) => {
    if (e.key === ' ' && state.tool === 'pan') {
      dispatch({ tool: state.previousTool });
    }
  }, [state.previousTool, state.tool]);

  const onSelectScene = useCallback((scene?: GameScene) => {
    if (state.selectedScene === scene) {
      dispatch({ selectedItem: undefined });

      return;
    }

    dispatch({ selectedScene: scene, selectedItem: undefined });
  }, [state.selectedScene]);

  const onSelectSensor = useCallback((scene: GameScene, sensor: GameSensor) => {
    if (state.selectedItem === sensor) {
      return;
    }

    dispatch({ selectedScene: scene, selectedItem: sensor });
  }, [state.selectedItem]);

  const onSelectTool = useCallback((tool: ToolType) => {
    dispatch({ tool });
  }, []);

  const onSceneChange = useCallback((scene: GameScene) => {
    onChange?.(scenes.map(s => s._file === scene._file ? scene : s));
  }, [onChange, scenes]);

  const getContext = useCallback((): CanvasContextType => ({
    selectedScene: state.selectedScene,
    selectedItem: state.selectedItem,
    tool: state.tool,
  }), [state.selectedScene, state.selectedItem, state.tool]);

  return (
    <CanvasContext.Provider value={getContext()}>
      <div
        className={classNames(
          'fixed w-screen h-screen top-0 left-0 pointer-events-none z-1000',
          'flex items-stretch',
        )}
      >
        <div
          className="flex-auto p-2"
        >
          <TitleBar className="pointer-events-auto" />
        </div>
        <Resizable
          defaultSize={{ width: 400 }}
          maxWidth="80%"
          minWidth={400}
          className={classNames(
            'flex-none pointer-events-auto',
          )}
        >
          <Sidebar
            onSceneChange={onSceneChange}
          />
        </Resizable>
      </div>
      <div
        className={classNames(
          'w-screen h-screen relative flex items-stretch overflow-hidden',
        )}
        onMouseDown={() => onSelectScene()}
      >
        <InfiniteCanvas
          ref={infiniteCanvasRef}
          cursorMode={state.tool === 'pan' ? 'pan' : 'default'}
          className={classNames(
            'flex-auto overflow-hidden !bg-transparent',
            { 'cursor-grab active:cursor-grabbing': state.tool === 'pan' },
          )}
        >
          <div className="flex items-start gap-8">
            { scenes.map(scene => (
              <Scene
                key={scene.name}
                scene={scene}
                onSelect={onSelectScene}
                onSelectSensor={onSelectSensor}
                onMove={onMoveScene}
                onChange={onSceneChange}
              />
            ))}
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
