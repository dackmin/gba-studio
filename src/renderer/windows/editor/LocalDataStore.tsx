import {
  type ComponentPropsWithoutRef,
  useCallback,
  useReducer,
  useEffect,
  useState,
} from 'react';
import { get, mockState, set, useEventListener, useTimeout } from '@junipero/react';

import { type LocalData, load, save } from '../../services/local-db';
import { type LocalDataContextType, LocalDataContext } from '../../services/contexts';
import { useApp, useEditor } from '../../services/hooks';

const LocalDataStore = ({ children }: ComponentPropsWithoutRef<any>) => {
  const { project, localData } = useApp();
  const { view } = useEditor();
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [state, dispatch] = useReducer(mockState<LocalData>, localData ?? {
    collapsed: [],
    sizes: {},
    emulator: {},
    editor: {},
  } satisfies LocalData);

  useEffect(() => {
    if (ready || !project?.id) {
      return;
    }

    dispatch(load(project.id));
    setReady(true);
  }, [ready, project?.id]);

  useTimeout(() => {
    save(project!.id!, state);
  }, 1000, [state, project?.id], { enabled: ready && !!project?.id && dirty });

  useEventListener('beforeunload', () => {
    if (ready || !project?.id) {
      return;
    }

    save(project.id, state);
  }, [state, ready, project?.id]);

  const isCollapsed = useCallback((key: string) => (
    state.collapsed.includes(key)
  ), [state.collapsed]);

  const collapse = useCallback((key: string) => {
    setDirty(true);
    dispatch(s => ({
      ...s,
      collapsed: isCollapsed(key)
        ? [...s.collapsed.filter(k => k !== key)]
        : Array.from(new Set([...s.collapsed, key])),
    }));
  }, [isCollapsed]);

  const getSize = useCallback((key: string, def?: number) => (
    get(state.sizes, key, def ?? 0)
  ), [state.sizes]);

  const setSize = useCallback((key: string, size: number) => {
    setDirty(true);
    dispatch(s => {
      set(s.sizes, key, size);

      return {
        ...s,
        sizes: { ...s.sizes },
      };
    });
  }, []);

  const getData = useCallback(<T = any>(key: string, def?: T) => (
    get(state, key, def)
  ), [state]);

  const setData = useCallback((key: string, value: any) => {
    setDirty(true);
    dispatch(s => {
      set(s, key, value);

      return { ...s };
    });
  }, []);

  useEffect(() => {
    if (!ready || !project?.id) {
      return;
    }

    setData('editor.view', view);
  }, [ready, project?.id, view, setData]);

  const getContext = useCallback((): LocalDataContextType => ({
    collapsed: state.collapsed,
    sizes: state.sizes,
    editor: state.editor,
    emulator: state.emulator,
    collapse,
    isCollapsed,
    getSize,
    setSize,
    getData,
    setData,
  }), [
    state.collapsed, state.sizes, state.editor, state.emulator,
    collapse, isCollapsed, getSize, setSize, setData, getData,
  ]);

  return (
    <LocalDataContext value={getContext()}>
      { children }
    </LocalDataContext>
  );
};

export default LocalDataStore;
