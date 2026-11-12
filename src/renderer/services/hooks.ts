import type { IpcRendererEvent } from 'electron';
import {
  type DependencyList,
  use,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useInfiniteCanvas, useTimeout } from '@junipero/react';

import { findFont, getAssetUrl, getGridSize } from '../../helpers';
import type { GameScene, PluginAssets } from '../../types';
import { hexToRgb } from './helpers';
import {
  AppContext,
  AudioContext,
  BottomBarTabsContext,
  CanvasContext,
  DraggableContext,
  DraggableContextType,
  EditorContext,
  EmulatorContext,
  EventsFilterContext,
  HudFormContext,
  LocalDataContext,
  LogsContext,
  ModalContext,
  PlaybackContext,
  SceneFormContext,
  ScriptFormContext,
  SpriteContext,
} from './contexts';

const noopSubscribe = () => () => {};

// Only subscribes when enabled so non-preview items skip cursor re-renders
export const usePreviewCursor = (enabled: boolean) => {
  const { subscribeCursor, getCursor } = useInfiniteCanvas();

  return useSyncExternalStore(
    enabled ? subscribeCursor : noopSubscribe,
    getCursor,
  );
};

const queryParams = () => {
  const params = new URLSearchParams(window.location.search);
  const q: Record<string, string> = {};
  params.forEach((value, key) => {
    q[key] = value;
  });

  return q;
};

export const useQuery = <T = Record<string, string>>(init: T = {} as T) => {
  const [query, setQuery] = useState<T>(() => ({
    ...init,
    ...queryParams(),
  }));

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

export const useApp = () => use(AppContext);

export const useAssets = () => {
  const { sprites, backgrounds, fonts, sounds, music, plugins } = useApp();

  return useMemo(() => {
    const provided = (plugins ?? [])
      .filter(p => p.enabled && p._assets)
      .map(p => p._assets!);

    return {
      sprites: [...sprites, ...provided.flatMap(a => a.sprites)],
      backgrounds: [...backgrounds, ...provided.flatMap(a => a.backgrounds)],
      fonts: [...fonts, ...provided.flatMap(a => a.fonts)],
      sounds: [...sounds, ...provided.flatMap(a => a.sounds)],
      music: [...music, ...provided.flatMap(a => a.music)],
    };
  }, [sprites, backgrounds, fonts, sounds, music, plugins]);
};

export const usePluginAssets = <T extends keyof PluginAssets>(name: T) => {
  const { plugins } = useApp();

  return useMemo(() => (plugins ?? [])
    .map(p => ({
      plugin: p,
      items: (p._assets?.[name] ?? [])
        .filter(item => item.discoverable !== false) as PluginAssets[T],
    }))
    .filter(({ plugin, items }) => plugin.enabled && items.length),
  [plugins, name]);
};

export const useGridSize = (scene?: GameScene) => getGridSize(scene?.map?.gridSize);
export const useEditor = () => use(EditorContext);
export const useCanvas = () => use(CanvasContext);
export const useSceneForm = () => use(SceneFormContext);
export const useScriptForm = () => use(ScriptFormContext);
export const useHudForm = () => use(HudFormContext);
export const useEventsFilter = () => use(EventsFilterContext);
export const useBottomBarTabs = () => use(BottomBarTabsContext);
export const useLogs = () => use(LogsContext);
export const useSprite = () => use(SpriteContext);
export const usePlayback = () => use(PlaybackContext);
export const useEmulator = () => use(EmulatorContext);
export const useLocalData = () => use(LocalDataContext);
export const useModal = () => use(ModalContext);
export const useAudio = () => use(AudioContext);
export const useDraggable = <T>() => use<DraggableContextType<T>>(DraggableContext);

export const useProjectFont = () => {
  const { project } = useApp();
  const { fonts } = useAssets();
  const selected = findFont(fonts, project?.settings?.font);

  return {
    fontUrl: selected ? getAssetUrl(selected) : undefined,
    glyphHeight: selected?.height || 8,
    transparencyColor: selected?.transparentColor
      ? hexToRgb(selected.transparentColor)
      : undefined,
  };
};

export const useBridgeListener = <T extends any[] = any[]>(
  channel: string,
  func: (...args: T) => void,
  deps: any[] = [],
) => {
  const funcRef = useRef(func);

  useEffect(() => {
    funcRef.current = func;
    // func is included so the ref is always fresh even if deps is incomplete;
    // this must never re-run the effect below (that would tear down and
    // re-add the native listener on every change).
    // eslint-disable-next-line @eslint-react/exhaustive-deps,react-hooks/exhaustive-deps
  }, [func, ...deps]);

  useEffect(() => {
    const cb = (
      _: IpcRendererEvent,
      ...args: any[]
    ) => {
      funcRef.current(...args as T);
    };

    const off = window.electron.addEventListener(channel, cb);

    return () => {
      off();
    };
  }, [channel]);
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
  deps: DependencyList = [],
) {
  const [args, setArgs] = useState<Parameters<T>>();

  useTimeout(() => {
    callback?.(...args || []);
    setArgs(undefined);
  }, delay, [callback, args, ...deps], { enabled: !!args });

  return (...args: Parameters<T>) => setArgs(args);
}
