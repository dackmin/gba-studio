import {
  type ComponentPropsWithoutRef,
  useCallback,
  useMemo,
  useReducer,
} from 'react';
import { mockState } from '@junipero/react';

import type {
  CollisionBrush,
  GameActor,
  GameHud,
  GameHudSprite,
  GameHudText,
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
import { useApp, useLocalData } from '../../services/hooks';

export interface CanvasState {
  selectedScene?: string;
  selectedHud?: string;
  selectedItem?: GameActor | GameSensor | GameScript | GamePlayer |
    GameHudSprite | GameHudText | GameVariable;
  tool: ToolType;
  previousTool: ToolType;
  subTool?: SubToolType;
  collisionBrush: CollisionBrush;
}

const Provider = ({
  children,
}: ComponentPropsWithoutRef<any>) => {
  const { onCanvasChange, ...appPayload } = useApp();
  const { getData, setData } = useLocalData();
  const [state, dispatch] = useReducer(mockState<CanvasState>, {
    selectedScene: getData?.('canvas.selectedScene'),
    selectedHud: undefined,
    selectedItem: undefined,
    tool: 'default',
    subTool: undefined,
    collisionBrush: 'normal',
    previousTool: 'default',
  });

  const selectedScene = useMemo(() => (
    appPayload.scenes.find(s => (
      s._file === state.selectedScene || s.id === state.selectedScene
    ))
  ), [appPayload.scenes, state.selectedScene]);

  const selectScene = useCallback((scene?: GameScene) => {
    if (selectedScene === scene) {
      dispatch({ selectedItem: undefined, selectedHud: undefined });

      return;
    }

    setData?.('canvas.selectedScene', scene?.id);
    dispatch({
      selectedScene: scene?.id,
      selectedHud: undefined,
      selectedItem: undefined,
    });
  }, [setData, selectedScene]);

  const selectedHud = useMemo(() => (
    appPayload.huds.find(h => (
      h._file === state.selectedHud || h.id === state.selectedHud
    ))
  ), [appPayload.huds, state.selectedHud]);

  const selectHud = useCallback((hud?: GameHud) => {
    dispatch({
      selectedHud: hud?.id,
      selectedScene: undefined,
      selectedItem: undefined,
    });
  }, []);

  const selectHudItem = useCallback((
    hud: GameHud,
    item?: GameHudSprite | GameHudText,
  ) => {
    if (state.selectedItem === item) {
      return;
    }

    dispatch({
      selectedHud: hud.id,
      selectedScene: undefined,
      selectedItem: item,
    });
  }, [state.selectedItem]);

  const selectScript = useCallback((script: GameScript) => {
    if (state.selectedItem === script) {
      return;
    }

    dispatch({
      selectedItem: script,
      selectedScene: undefined,
      selectedHud: undefined,
    });
  }, [state.selectedItem]);

  const selectVariable = useCallback((variable: GameVariable) => {
    if (state.selectedItem === variable) {
      return;
    }

    dispatch({
      selectedItem: variable,
      selectedScene: undefined,
      selectedHud: undefined,
    });
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

  const setCollisionBrush = useCallback((collisionBrush: CollisionBrush) => {
    dispatch({ collisionBrush });
  }, []);

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

    dispatch({
      selectedScene: scene._file,
      selectedHud: undefined,
      selectedItem: item,
    });
  }, [state.selectedItem]);

  const resetSelection = useCallback(() => {
    dispatch({
      selectedItem: undefined,
      selectedScene: undefined,
      selectedHud: undefined,
    });
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

  const onHudChange = useCallback((hud?: GameHud) => {
    onCanvasChange?.({
      ...appPayload,
      huds: appPayload.huds.map(h => (
        h.id === hud?.id || h._file === hud?._file ? hud! : h
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
        .map(s => (s.id === script.id || s._file === script._file) ? script : s),
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
    selectedHud,
    selectedItem: state.selectedItem,
    tool: state.tool,
    subTool: state.subTool,
    collisionBrush: state.collisionBrush,
    setCollisionBrush,
    setTool,
    resetTool,
    selectItem,
    selectVariable,
    resetSelection,
    selectScene,
    selectHud,
    selectHudItem,
    selectScript,
    onVariablesChange,
    onScriptsChange,
    onScriptChange,
    onScenesChange,
    onSceneChange,
    onHudChange,
    onVariableChange,
  }), [
    selectedScene, selectedHud,
    state.selectedItem, state.tool, state.subTool, state.collisionBrush,
    setCollisionBrush,
    selectScene, selectScript, onVariablesChange, onScriptsChange, setTool,
    resetTool, selectItem, resetSelection, onSceneChange, onScriptChange,
    onScenesChange, selectVariable, onVariableChange,
    selectHud, selectHudItem, onHudChange,
  ]);

  return (
    <CanvasContext value={getContext()}>
      { children }
    </CanvasContext>
  );
};

export default Provider;
