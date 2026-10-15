import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { Theme } from '@radix-ui/themes';
import { type MoveableState, cloneDeep, mockState, pick, useInterval } from '@junipero/react';

import type {
  AppPayload,
  AppStorage,
  GameHud,
  GameProject,
  GameScene,
} from '../types';
import { type AppContextType, AppContext } from './services/contexts';
import {
  useBridgeListener,
  useDelayedCallback,
  useQuery,
} from './services/hooks';
import { isEditableElementFocused } from './services/helpers';
import { load, LocalData } from './services/local-db';
import EventEmitter from './services/emitter';
import ProjectSelection from './windows/project-selection';
import Editor from './windows/editor';
import RecoveredAutosaveBanner from './windows/editor/RecoveredAutosaveBanner';

export interface AppState extends Omit<AppPayload, 'project'> {
  projectBase: string;
  theme: string;
  history: Partial<AppPayload>[];
  historyIndex: number;
  loading: boolean;
  ready: boolean;
  dirty: boolean;
  project?: GameProject;
  editorConfig?: AppStorage;
  clipboard?: any;
  localData?: LocalData;
  isFullscreen: boolean;
}

const App = () => {
  const eventsRef = useRef<EventEmitter>(new EventEmitter());
  const { projectPath, resourcesPath, projectBase, theme, isFullscreen } = useQuery();
  const [recoveredAutosave, setRecoveredAutosave] = useState(false);
  const [state, dispatch] = useReducer(mockState<AppState>, {
    theme,
    projectBase,
    loading: true,
    ready: false,
    scenes: [],
    huds: [],
    variables: [],
    sprites: [],
    backgrounds: [],
    fonts: [],
    music: [],
    sounds: [],
    scripts: [],
    project: undefined,
    dirty: false,
    history: [],
    historyIndex: 0,
    clipboard: undefined,
    localData: undefined,
    isFullscreen: isFullscreen === 'true',
  });
  const autosaveState = useRef(state);

  useBridgeListener('fullscreen-updated', (isFullscreen: boolean) => {
    dispatch({ isFullscreen });
  }, []);

  useBridgeListener('theme-updated', (newTheme: string) => {
    document.querySelector('html')?.classList.remove('light', 'dark');
    document.querySelector('html')?.classList.add(newTheme);
  }, []);

  useBridgeListener('graphics-updated', ({ sprites, backgrounds, fonts }) => {
    dispatch({ sprites, backgrounds, fonts });
  }, []);

  useBridgeListener('audio-updated', ({ music, sounds }) => {
    dispatch({ music, sounds });
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
      const clipboard = await window.electron.getClipboard();

      const recovered = data._recoveredAutosave;
      setRecoveredAutosave(recovered);

      dispatch({
        ...data,
        history: [cloneDeep(data)],
        historyIndex: 0,
        loading: false,
        dirty: recovered,
        editorConfig,
        ready: true,
        clipboard,
        localData: load(data.project?.id || ''),
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
        ...pick(state, [
          'project',
          'scenes',
          'huds',
          'variables',
          'scripts',
          'backgrounds',
          'fonts',
          'sprites',
          'music',
          'sounds',
        ]),
      });
      dispatch({ dirty: false });
      setRecoveredAutosave(false);
    }
  }, [
    projectPath, state,
  ]);

  useEffect(() => {
    autosaveState.current = state;
  }, [state]);

  useInterval(() => {
    if (!state.ready || !state.dirty || !projectPath) {
      return;
    }

    window.electron.autosaveProject(projectPath, {
      ...pick(autosaveState.current, [
        'project',
        'scenes',
        'huds',
        'variables',
        'scripts',
        'backgrounds',
        'fonts',
        'sprites',
        'music',
        'sounds',
      ]),
    });
  }, 2000, [state.ready, state.dirty, projectPath]);

  // Immediate (non-debounced) autosave, used when the user cancels closing
  const autosaveNow = useCallback(async () => {
    if (!projectPath) {
      return;
    }

    await window.electron.autosaveProject(projectPath, {
      ...pick(state, [
        'project',
        'scenes',
        'huds',
        'variables',
        'scripts',
        'backgrounds',
        'fonts',
        'sprites',
        'music',
        'sounds',
      ]),
    });
  }, [
    projectPath, state,
  ]);

  const discardAutosave = useCallback(async () => {
    if (projectPath) {
      await window.electron.discardAutosave(projectPath);
      setRecoveredAutosave(false);
    }
  }, [projectPath]);

  useBridgeListener('save', () => {
    if (state.dirty) {
      save();
    }
  }, [state.dirty, save]);

  useBridgeListener('request-close', async () => {
    if (!state.dirty) {
      window.electron.confirmClose();

      return;
    }

    const choice = await window.electron.showUnsavedChangesDialog();

    if (choice === 'save') {
      await save();
      window.electron.confirmClose();
    } else if (choice === 'discard') {
      await discardAutosave();
      window.electron.confirmClose();
    } else {
      await autosaveNow();
      window.electron.cancelClose();
    }
  }, [state.dirty, save, autosaveNow, discardAutosave]);

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
    if (isEditableElementFocused()) {
      return;
    }

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
    if (isEditableElementFocused()) {
      return;
    }

    redo();
  }, [redo]);

  const addToHistory = useDelayedCallback((currentState: AppState) => {
    const newHistoryEntry: Partial<AppPayload> = cloneDeep(pick(currentState, [
      'project',
      'scenes',
      'huds',
      'variables',
      'scripts',
      'sprites',
      'backgrounds',
      'fonts',
      'music',
      'sounds',
    ]));

    const newHistory = currentState.history.slice(currentState.historyIndex);
    newHistory.unshift(newHistoryEntry);

    dispatch({ history: newHistory.slice(0, 50), historyIndex: 0 });
  }, 400, []);

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

      addToHistory(s);

      return { ...s, dirty: true };
    });
  }, [addToHistory]);

  const onMoveHud = useCallback((
    hud: GameHud,
    e: Partial<MoveableState>
  ) => {
    dispatch(s => {
      if (!s.project || !hud._file) {
        return s;
      }

      const x = Math.round(e.deltaX || 0);
      const y = Math.round(e.deltaY || 0);
      const found = s.project.huds
        ?.find(h => h.id === hud.id || h._file === hud._file);

      if (found) {
        if (found.x === x && found.y === y) {
          return s;
        }

        found.id = hud.id;
        found.x = x;
        found.y = y;
      } else {
        s.project.huds = s.project.huds || [];
        s.project.huds.push({ x, y, id: hud.id, _file: hud._file });
      }

      addToHistory(s);

      return { ...s, dirty: true };
    });
  }, [addToHistory]);

  const onCanvasChange = useCallback((payload: Partial<AppPayload>) => {
    dispatch(s => {
      const res = { ...s, ...payload, dirty: true };
      addToHistory(res);

      return res;
    });
  }, [addToHistory]);

  const onProjectChange = useCallback((project: GameProject) => {
    dispatch(s => {
      const res = { ...s, project, dirty: true };
      addToHistory(res);

      return res;
    });
  }, [addToHistory]);

  const setEditorConfig = useCallback((config: AppStorage) => {
    dispatch({ editorConfig: config });
    window.electron.setEditorConfig(config);
  }, []);

  const setClipboard = useCallback((data: any) => {
    dispatch({ clipboard: data });
    window.electron.registerClipboard(data);
  }, []);

  const getContext = useCallback((): AppContextType => ({
    eventEmitter: eventsRef.current,
    project: state.project,
    scenes: state.scenes,
    huds: state.huds,
    dirty: state.dirty,
    variables: state.variables,
    sprites: state.sprites,
    backgrounds: state.backgrounds,
    fonts: state.fonts,
    music: state.music,
    sounds: state.sounds,
    scripts: state.scripts,
    projectPath: projectPath || '',
    projectBase: state.projectBase,
    editorConfig: state.editorConfig,
    clipboard: state.clipboard,
    localData: state.localData,
    isFullscreen: state.isFullscreen,
    resourcesPath,
    save,
    setEditorConfig,
    setClipboard,
    onMoveScene,
    onMoveHud,
    onCanvasChange,
    onProjectChange,
  }), [
    projectPath, resourcesPath,
    state.scenes, state.huds, state.projectBase, state.variables, state.project,
    state.dirty, state.sprites, state.backgrounds, state.fonts, state.sounds,
    state.scripts, state.music, state.editorConfig,
    state.clipboard, state.localData, state.isFullscreen,
    save, onCanvasChange, onMoveScene, onMoveHud, onProjectChange,
    setEditorConfig, setClipboard,
  ]);

  return (
    <Theme hasBackground={false}>
      <AppContext value={getContext()}>
        { projectPath ? state.ready && (
          <Editor />
        ) : (
          <ProjectSelection />
        ) }
        { recoveredAutosave && state.ready && (
          <RecoveredAutosaveBanner
            onDiscard={discardAutosave}
          />
        ) }
      </AppContext>
    </Theme>
  );
};

export default App;
