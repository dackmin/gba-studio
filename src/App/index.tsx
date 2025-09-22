import { useCallback, useEffect, useLayoutEffect, useReducer } from 'react';
import { Theme } from '@radix-ui/themes';
import { mockState } from '@junipero/react';

import type { GameScene } from '../types';
import { type AppContextType, AppContext } from '../contexts';
import { useQuery } from '../hooks';
import Canvas from '../Canvas';
import ProjectSelection from '../ProjectSelection';

export interface AppState {
  projectPath: string;
  projectBase: string;
  theme: string;
  scenes: GameScene[];
  loading: boolean;
  ready: boolean;
}

const App = () => {
  const { projectPath, projectBase, theme } = useQuery();
  const [state, dispatch] = useReducer(mockState<AppState>, {
    theme,
    projectPath,
    projectBase,
    loading: true,
    ready: false,
    scenes: [],
  });

  useLayoutEffect(() => {
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

    document.querySelector('html')?.classList.remove('light', 'dark');
    document.querySelector('html')?.classList.add(preferred);
  }, []);

  useEffect(() => {
    if (state.ready) {
      return;
    }

    init();
  }, [projectPath]);

  const init = async () => {
    if (projectPath) {
      const scenes = await window.electron.loadScenes(projectPath);
      dispatch({ scenes, projectPath, loading: false, ready: true });
    }
  };

  const getContext = useCallback((): AppContextType => ({
    scenes: state.scenes,
    projectPath: state.projectPath,
    projectBase: state.projectBase,
  }), [
    state.scenes, state.projectPath, state.projectBase,
  ]);

  return (
    <Theme>
      <AppContext.Provider value={getContext()}>
        { projectPath ? (
          <Canvas />
        ) : (
          <ProjectSelection />
        ) }
      </AppContext.Provider>
    </Theme>
  );
};

export default App;
