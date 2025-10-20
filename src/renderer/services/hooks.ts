import type { IpcRendererEvent } from 'electron';
import { useContext, useDeferredValue, useEffect, useState } from 'react';
import { useTimeout } from '@junipero/react';

import { AppContext, CanvasContext, EditorContext, SceneFormContext } from './contexts';

const queryParams = () => {
  const params = new URLSearchParams(window.location.search);
  const q: Record<string, string> = {};
  params.forEach((value, key) => {
    q[key] = value;
  });

  return q;
};

export const useQuery = <T = Record<string, string>>(init: T = {} as T) => {
  const [query, setQuery] = useState<T>({
    ...init,
    ...queryParams(),
  });

  useEffect(() => {
    const onChange = () => {
      setQuery(prev => ({
        ...prev,
        ...queryParams(),
      }));
    };

    window.addEventListener('popstate', onChange);

    return () => {
      window.removeEventListener('popstate', onChange);
    };
  }, []);

  return query;
};

export const useApp = () => useContext(AppContext);
export const useEditor = () => useContext(EditorContext);
export const useCanvas = () => useContext(CanvasContext);
export const useSceneForm = () => useContext(SceneFormContext);

export const useBridgeListener = (
  channel: string,
  func: (...args: any[]) => void,
  deps: any[] = [],
) => {
  useEffect(() => {
    return window.electron.addEventListener(channel, (
      event: IpcRendererEvent,
      ...args: any[]
    ) => {
      func(...args);
    });
  }, [func, ...deps]);
};

export interface UseDelayedValueOptions {
  /**
   * Delay in ms
   */
  delay?: number;
}

export function useDelayedValue<T> (
  /**
   * Value to delay
   */
  value: T,
  { delay = 400 }: UseDelayedValueOptions = {}
): T {
  const [delayedValue, setDelayedValue] = useState(value);

  useTimeout(() => {
    setDelayedValue(value);
  }, delay, [value, setDelayedValue]);

  return useDeferredValue<T>(delayedValue);
}

export function useDelayedCallback<T extends (...args: any[]) => void> (
  /**
   * Effect to run after delay
   */
  callback?: T,
  /**
   * Delay in ms
   */
  delay = 400,
  /**
   * Effect dependencies
   */
  deps: any[] = [],
) {
  const [args, setArgs] = useState<Parameters<T>>();

  useTimeout(() => {
    callback?.(...args || []);
    setArgs(undefined);
  }, delay, [callback, args, ...deps], { enabled: !!args });

  return (...args: Parameters<T>) => setArgs(args);
}
