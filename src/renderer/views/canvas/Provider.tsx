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
  GameVariable,
  GameVariables,
  SubToolType,
  ToolType,
} from '../../../types';
import { type CanvasContextType, CanvasContext } from '../../services/contexts';
import { useApp } from '../../services/hooks';

export interface CanvasState {
  selectedScene?: string;
  selectedItem?: GameActor | GameSensor | GameScript | GamePlayer |
    GameVariable;
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
    appPayload.scenes.find(s => (
      s._file === state.selectedScene || s.id === state.selectedScene
    ))
  ), [appPayload.scenes, state.selectedScene]);

  const selectScene = useCallback((scene?: GameScene) => {
    if (selectedScene === scene) {
      dispatch({ selectedItem: undefined });

      return;
    }

    dispatch({ selectedScene: scene?.id, selectedItem: undefined });
  }, [selectedScene]);

  const selectScript = useCallback((script: GameScript) => {
    if (state.selectedItem === script) {
      return;
    }

    dispatch({ selectedItem: script, selectedScene: undefined });
  }, [state.selectedItem]);

  const selectVariable = useCallback((variable: GameVariable) => {
    if (state.selectedItem === variable) {
      return;
    }

    dispatch({ selectedItem: variable, selectedScene: undefined });
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
  }, [state.selectedItem]);

  const resetSelection = useCallback(() => {
    dispatch({ selectedItem: undefined, selectedScene: undefined });
  }, []);

  const onScenesChange = useCallback((scenes: GameScene[]) => {
    onCanvasChange?.({
      ...appPayload,
      scenes,
    });
    dispatch({
      selectedScene: scenes.find(s => s._file === state.selectedScene)?.id,
    });
  }, [onCanvasChange, appPayload, state.selectedScene]);

  const onSceneChange = useCallback((scene?: GameScene) => {
    onCanvasChange?.({
      ...appPayload,
      scenes: appPayload.scenes.map(s => (
        s.id === scene?.id || s._file === scene?._file ? scene! : s
      )),
    });
  }, [onCanvasChange, appPayload]);

  const onScriptsChange = useCallback((scripts: GameScript[]) => {
    onCanvasChange?.({
      ...appPayload,
      scripts,
    });
    dispatch({ selectedItem: scripts.find(s => s === state.selectedItem) });
  }, [onCanvasChange, appPayload, state.selectedItem]);

  const onScriptChange = useCallback((script: GameScript) => {
    onCanvasChange?.({
      ...appPayload,
      scripts: appPayload.scripts
        .map(s => s._file === script._file ? script : s),
    });
    dispatch({ selectedItem: script });
  }, [onCanvasChange, appPayload]);

  const onVariableChange = useCallback((variable: GameVariable) => {
    onCanvasChange?.({
      ...appPayload,
      variables: appPayload.variables
        .map(v => {
          if (v.values?.some(val => val === variable)) {
            return {
              ...v,
              values: v.values.map(val => val === variable ? variable : val),
            };
          }

          return v;
        }),
    });
    dispatch({ selectedItem: variable });
  }, [onCanvasChange, appPayload]);

  const getContext = useCallback((): CanvasContextType => ({
    selectedScene,
    selectedItem: state.selectedItem,
    tool: state.tool,
    subTool: state.subTool,
    setTool,
    resetTool,
    selectItem,
    selectVariable,
    resetSelection,
    selectScene,
    selectScript,
    onVariablesChange,
    onScriptsChange,
    onScriptChange,
    onScenesChange,
    onSceneChange,
    onVariableChange,
  }), [
    selectedScene,
    state.selectedItem, state.tool, state.subTool,
    selectScene, selectScript, onVariablesChange, onScriptsChange, setTool,
    resetTool, selectItem, resetSelection, onSceneChange, onScriptChange,
    onScenesChange, selectVariable, onVariableChange,
  ]);

  return (
    <CanvasContext.Provider value={getContext()}>
      { children }
    </CanvasContext.Provider>
  );
};

export default Provider;
