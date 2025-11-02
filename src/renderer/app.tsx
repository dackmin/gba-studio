import { useCallback, useEffect, useLayoutEffect, useReducer } from 'react';
import { Theme } from '@radix-ui/themes';
import { type MoveableState, cloneDeep, mockState } from '@junipero/react';
import { useHotkeys } from 'react-hotkeys-hook';

import type {
  AppPayload,
  AppStorage,
  GameProject,
  GameScene,
} from '../types';
import { type AppContextType, AppContext } from './services/contexts';
import { useBridgeListener, useQuery } from './services/hooks';
import ProjectSelection from './windows/project-selection';
import Editor from './windows/editor';

export interface AppState extends Omit<AppPayload, 'project'> {
  projectBase: string;
  theme: string;
  history: Partial<AppPayload>[];
  historyIndex: number;
  loading: boolean;
  ready: boolean;
  dirty: boolean;
  building: boolean;
  project?: GameProject;
  editorConfig?: AppStorage;
}

const App = () => {
  const { projectPath, resourcesPath, projectBase, theme } = useQuery();
  const [state, dispatch] = useReducer(mockState<AppState>, {
    theme,
    projectBase,
    loading: true,
    ready: false,
    scenes: [],
    variables: [],
    sprites: [],
    backgrounds: [],
    music: [],
    sounds: [],
    scripts: [],
    project: undefined,
    dirty: false,
    history: [],
    historyIndex: 0,
    building: false,
  });

  useBridgeListener('build-completed', () => {
    dispatch({ building: false });
  }, []);

  useBridgeListener('build-aborted', () => {
    dispatch({ building: false });
  }, []);

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
      const editorConfig = await window.electron.getEditorConfig();

      dispatch({
        ...data,
        history: [cloneDeep(data)],
        historyIndex: 0,
        loading: false,
        editorConfig,
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
        scripts: state.scripts,
      });
      dispatch({ dirty: false });
    }
  }, [
    projectPath,
    state.project, state.scenes, state.variables, state.scripts,
  ]);

  useHotkeys('mod+s', e => {
    e.preventDefault();

    if (state.dirty) {
      save();
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
      scripts: cloneDeep(currentState.scripts),
    };

    const newHistory = currentState.history.slice(currentState.historyIndex);
    newHistory.unshift(newHistoryEntry);

    return newHistory.slice(0, 50);
  }, []);

  const onMoveScene = useCallback((
    scene: GameScene,
    e: Partial<MoveableState>
  ) => {
    dispatch(s => {
      const foundScene = s.project?.scenes
        ?.find(sc => sc.id === scene.id || sc._file === scene._file);

      if (foundScene) {
        if (
          foundScene.x === Math.round(e.deltaX || 0) &&
          foundScene.y === Math.round(e.deltaY || 0)
        ) {
          return s;
        }

        foundScene.id = scene.id;
        foundScene.x = Math.round(e.deltaX || 0);
        foundScene.y = Math.round(e.deltaY || 0);
      } else if (s.project && scene._file) {
        s.project.scenes = s.project.scenes || [];
        s.project.scenes.push({
          x: Math.round(e.deltaX || 0),
          y: Math.round(e.deltaY || 0),
          id: scene.id,
          _file: scene._file,
        });
      }

      return { ...s, history: addToHistory(s), historyIndex: 0, dirty: true };
    });
  }, [addToHistory]);

  const onCanvasChange = useCallback((payload: Partial<AppPayload>) => {
    dispatch(s => ({
      ...s,
      ...payload,
      history: addToHistory(s),
      historyIndex: 0,
      dirty: true,
    }));
  }, [addToHistory]);

  const onProjectChange = useCallback((project: GameProject) => {
    dispatch(s => ({
      ...s,
      project,
      history: addToHistory(s),
      historyIndex: 0,
      dirty: true,
    }));
  }, [addToHistory]);

  const setBuilding = useCallback((building: boolean) => {
    dispatch({ building });
  }, []);

  const setEditorConfig = useCallback((config: AppStorage) => {
    dispatch({ editorConfig: config });
    window.electron.setEditorConfig(config);
  }, []);

  const getContext = useCallback((): AppContextType => ({
    project: state.project,
    scenes: state.scenes,
    dirty: state.dirty,
    building: state.building,
    variables: state.variables,
    sprites: state.sprites,
    backgrounds: state.backgrounds,
    music: state.music,
    sounds: state.sounds,
    scripts: state.scripts,
    projectPath: projectPath || '',
    projectBase: state.projectBase,
    editorConfig: state.editorConfig,
    resourcesPath,
    save,
    setBuilding,
    setEditorConfig,
    onMoveScene,
    onCanvasChange,
    onProjectChange,
  }), [
    projectPath, resourcesPath,
    state.scenes, state.projectBase, state.variables, state.project,
    state.dirty, state.sprites, state.backgrounds, state.sounds,
    state.scripts, state.music, state.building, state.editorConfig,
    save, setBuilding, onCanvasChange, onMoveScene, onProjectChange,
    setEditorConfig,
  ]);

  return (
    <Theme hasBackground={false}>
      <AppContext.Provider value={getContext()}>
        { projectPath ? (
          <Editor />
        ) : (
          <ProjectSelection />
        ) }
      </AppContext.Provider>
    </Theme>
  );
};

export default App;
