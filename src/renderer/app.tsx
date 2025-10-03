import { useCallback, useEffect, useLayoutEffect, useReducer } from 'react';
import { Theme } from '@radix-ui/themes';
import { type MoveableState, cloneDeep, mockState } from '@junipero/react';
import { useHotkeys } from 'react-hotkeys-hook';

import type {
  AppPayload,
  GameBackground,
  GameProject,
  GameScene,
  GameSprite,
  GameVariables,
} from '../types';
import { type AppContextType, AppContext } from './services/contexts';
import { useBridgeListener, useQuery } from './services/hooks';
import Canvas from './pages/canvas';
import ProjectSelection from './pages/project-selection';

export interface AppState {
  projectBase: string;
  theme: string;
  scenes: GameScene[];
  variables: GameVariables[];
  sprites: GameSprite[];
  backgrounds: GameBackground[];
  history: Partial<AppPayload>[];
  historyIndex: number;
  loading: boolean;
  ready: boolean;
  dirty: boolean;
  project?: GameProject;
}

const App = () => {
  const { projectPath, projectBase, theme } = useQuery();
  const [state, dispatch] = useReducer(mockState<AppState>, {
    theme,
    projectBase,
    loading: true,
    ready: false,
    scenes: [],
    variables: [],
    sprites: [],
    backgrounds: [],
    project: undefined,
    dirty: false,
    history: [],
    historyIndex: 0,
  });

  useLayoutEffect(() => {
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

    document.querySelector('html')?.classList.remove('light', 'dark');
    document.querySelector('html')?.classList.add(preferred);
  }, []);

  const init = useCallback(async () => {
    if (projectPath) {
      const data = await window.electron.loadProject(projectPath);
      dispatch({
        ...data,
        history: [cloneDeep(data)],
        historyIndex: 0,
        loading: false,
        ready: true,
      });
    }
  }, [projectPath]);

  useEffect(() => {
    if (state.ready) {
      return;
    }

    init();
  }, [state.ready, init]);

  const save = useCallback(async () => {
    if (projectPath) {
      await window.electron.saveProject(projectPath, {
        project: state.project,
        scenes: state.scenes,
        variables: state.variables,
      });
    }
  }, [
    projectPath,
    state.project, state.scenes, state.variables,
  ]);

  useHotkeys('mod+s', e => {
    e.preventDefault();

    if (state.dirty) {
      save();
      dispatch({ dirty: false });
    }
  }, [state.dirty, save]);

  const undo = useCallback(() => {
    if (state.history.length === 0 ||
        state.historyIndex >= state.history.length - 1) {
      return;
    }

    const past = state.history[state.historyIndex + 1];

    if (past) {
      dispatch({
        ...past,
        historyIndex: state.historyIndex + 1,
        dirty: true,
      });
    }
  }, [state.history, state.historyIndex]);

  useBridgeListener('undo', () => {
    undo();
  }, [undo]);

  const redo = useCallback(() => {
    if (state.historyIndex <= 0) {
      return;
    }

    const future = state.history[state.historyIndex - 1];

    if (future) {
      dispatch({
        ...future,
        historyIndex: state.historyIndex - 1,
        dirty: true,
      });
    }
  }, [state.history, state.historyIndex]);

  useBridgeListener('redo', () => {
    redo();
  }, [redo]);

  const addToHistory = useCallback((currentState: AppState) => {
    const newHistoryEntry: Partial<AppPayload> = {
      project: cloneDeep(currentState.project!),
      scenes: cloneDeep(currentState.scenes),
      variables: cloneDeep(currentState.variables),
    };

    const newHistory = currentState.history.slice(currentState.historyIndex);
    newHistory.unshift(newHistoryEntry);

    return newHistory.slice(0, 50);
  }, []);

  const onMoveScene = useCallback((scene: GameScene, e: MoveableState) => {
    dispatch(s => {
      const foundScene = s.project?.scenes
        ?.find(sc => sc._file === scene._file);

      if (foundScene) {
        if (
          foundScene.x === Math.round(e.deltaX || 0) &&
          foundScene.y === Math.round(e.deltaY || 0)
        ) {
          return s;
        }

        foundScene.x = Math.round(e.deltaX || 0);
        foundScene.y = Math.round(e.deltaY || 0);
      } else if (s.project && scene._file) {
        s.project.scenes = s.project.scenes || [];
        s.project.scenes.push({
          _file: scene._file,
          x: Math.round(e.deltaX || 0),
          y: Math.round(e.deltaY || 0),
        });
      }

      return { ...s, history: addToHistory(s), historyIndex: 0, dirty: true };
    });
  }, [addToHistory]);

  const onCanvasChange = useCallback((scenes: GameScene[]) => {
    dispatch(s => ({
      ...s,
      scenes,
      history: addToHistory(s),
      historyIndex: 0,
      dirty: true,
    }));
  }, [addToHistory]);

  const getContext = useCallback((): AppContextType => ({
    project: state.project,
    scenes: state.scenes,
    dirty: state.dirty,
    variables: state.variables,
    sprites: state.sprites,
    backgrounds: state.backgrounds,
    projectPath: projectPath || '',
    projectBase: state.projectBase,
  }), [
    projectPath,
    state.scenes, state.projectBase, state.variables, state.project,
    state.dirty, state.sprites, state.backgrounds,
  ]);

  return (
    <Theme hasBackground={false}>
      <AppContext.Provider value={getContext()}>
        { projectPath ? (
          <Canvas
            onMoveScene={onMoveScene}
            onChange={onCanvasChange}
          />
        ) : (
          <ProjectSelection />
        ) }
      </AppContext.Provider>
    </Theme>
  );
};

export default App;
