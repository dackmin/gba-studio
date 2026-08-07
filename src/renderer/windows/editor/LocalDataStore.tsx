import {
  type ComponentPropsWithoutRef,
  useCallback,
  useReducer,
  useEffect,
  useState,
} from 'react';
import { mockState, useEventListener, useTimeout } from '@junipero/react';

import { type LocalData, load, save } from '../../services/local-db';
import { type LocalDataContextType, LocalDataContext } from '../../services/contexts';
import { useApp } from '../../services/hooks';

const LocalDataStore = ({ children }: ComponentPropsWithoutRef<any>) => {
  const { project } = useApp();
  const [ready, setReady] = useState(false);
  const [state, dispatch] = useReducer(mockState<LocalData>, {
    collapsed: [],
  });

  useEffect(() => {
    if (ready) {
      return;
    }

    dispatch(load(project?.id || 'default'));
    setReady(true);
  }, [ready, project?.id]);

  useTimeout(() => {
    save(project?.id || 'default', state);
  }, 1000, [state, project?.id], { enabled: ready });

  useEventListener('beforeunload', () => {
    save(project?.id || 'default', state);
  }, [state, project?.id]);

  const isCollapsed = useCallback((key: string) => (
    state.collapsed.includes(key)
  ), [state.collapsed]);

  const collapse = useCallback((key: string) => {
    dispatch(s => ({
      ...s,
      collapsed: isCollapsed(key)
        ? [...s.collapsed.filter(k => k !== key)]
        : Array.from(new Set([...s.collapsed, key])),
    }));
  }, [isCollapsed]);

  const getContext = useCallback((): LocalDataContextType => ({
    collapsed: state.collapsed,
    collapse,
    isCollapsed,
  }), [
    state.collapsed,
    collapse, isCollapsed,
  ]);

  return (
    <LocalDataContext value={getContext()}>
      { children }
    </LocalDataContext>
  );
};

export default LocalDataStore;
