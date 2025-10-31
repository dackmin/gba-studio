import {
  type ComponentPropsWithoutRef,
  useCallback,
  useMemo,
  useReducer,
} from 'react';
import { mockState } from '@junipero/react';

import type {
  GameActor,
  GamePlayer,
  GameScene,
  GameScript,
  GameSensor,
  GameVariables,
  SubToolType,
  ToolType,
} from '../../../types';
import { type CanvasContextType, CanvasContext } from '../../services/contexts';
import { useApp } from '../../services/hooks';

export interface CanvasState {
  selectedScene?: string;
  selectedItem?: GameActor | GameSensor | GameScript | GamePlayer;
  tool: ToolType;
  previousTool: ToolType;
  subTool?: SubToolType;
}

const Provider = ({
  children,
}: ComponentPropsWithoutRef<any>) => {
  const { onCanvasChange, ...appPayload } = useApp();
  const [state, dispatch] = useReducer(mockState<CanvasState>, {
    selectedScene: undefined,
    selectedItem: undefined,
    tool: 'default',
    subTool: undefined,
    previousTool: 'default',
  });

  const selectedScene = useMemo(() => (
    appPayload.scenes.find(s => s._file === state.selectedScene)
  ), [appPayload.scenes, state.selectedScene]);

  const selectScene = useCallback((scene?: GameScene) => {
    if (selectedScene === scene) {
      dispatch({ selectedItem: undefined });

      return;
    }

    dispatch({ selectedScene: scene?._file, selectedItem: undefined });
  }, [selectedScene]);

  const selectScript = useCallback((script: GameScript) => {
    if (state.selectedItem === script) {
      return;
    }

    dispatch({ selectedItem: script, selectedScene: undefined });
  }, [state.selectedItem]);

  const onVariablesChange = useCallback((registry: GameVariables) => {
    onCanvasChange?.({
      ...appPayload,
      variables: appPayload
        .variables.map(v => v._file === registry._file ? registry : v),
    });
  }, [onCanvasChange, appPayload]);

  const setTool = useCallback((tool: ToolType, subTool?: SubToolType) => {
    dispatch({
      previousTool: state.tool,
      tool,
      subTool,
    });
  }, [state.tool]);

  const resetTool = useCallback(() => {
    dispatch({ tool: state.previousTool });
  }, [state.previousTool]);

  const selectItem = useCallback((
    scene: GameScene,
    item: GameActor | GameSensor | GamePlayer | undefined
  ) => {
    if (state.selectedItem === item) {
      return;
    }

    dispatch({ selectedScene: scene._file, selectedItem: item });
  }, []);

  const resetSelection = useCallback(() => {
    dispatch({ selectedItem: undefined, selectedScene: undefined });
  }, []);

  const onSceneChange = useCallback((scene?: GameScene) => {
    onCanvasChange?.({
      ...appPayload,
      scenes: appPayload.scenes.map(s => (
        s.id === scene?.id || s._file === scene?._file ? scene! : s
      )),
    });
  }, [onCanvasChange, appPayload.scenes]);

  const onScriptsChange = useCallback((scripts: GameScript[]) => {
    onCanvasChange?.({
      ...appPayload,
      scripts,
    });
    dispatch({ selectedItem: scripts.find(s => s === state.selectedItem) });
  }, [onCanvasChange, appPayload]);

  const onScriptChange = useCallback((script: GameScript) => {
    onCanvasChange?.({
      ...appPayload,
      scripts: appPayload.scripts
        .map(s => s._file === script._file ? script : s),
    });
    dispatch({ selectedItem: script });
  }, [onCanvasChange, appPayload]);

  const getContext = useCallback((): CanvasContextType => ({
    selectedScene,
    selectedItem: state.selectedItem,
    tool: state.tool,
    subTool: state.subTool,
    setTool,
    resetTool,
    selectItem,
    resetSelection,
    selectScene,
    selectScript,
    onVariablesChange,
    onScriptsChange,
    onScriptChange,
    onSceneChange,
  }), [
    selectedScene,
    state.selectedItem, state.tool, state.subTool,
    selectScene, selectScript, onVariablesChange, onScriptsChange, setTool,
    resetTool, selectItem, resetSelection, onSceneChange, onScriptChange,
  ]);

  return (
    <CanvasContext.Provider value={getContext()}>
      { children }
    </CanvasContext.Provider>
  );
};

export default Provider;
