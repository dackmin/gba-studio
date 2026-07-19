import {
  type ComponentPropsWithoutRef,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { mockState } from '@junipero/react';

import type { SpriteAnimation, SpriteAnimationFrame } from '../../../types';
import { type PlaybackContextType, PlaybackContext } from '../../services/contexts';
import { useSprite } from '../../services/hooks';

export interface PlaybackProviderState {
  playing: boolean;
  index: number;
}

const PlaybackProvider = ({ children }: ComponentPropsWithoutRef<'div'>) => {
  const { selectedAnimation, selectedState, selectedStateName, selectedDirection } = useSprite();
  const playbackTimerRef = useRef<NodeJS.Timeout>(undefined);
  const [state, dispatch] = useReducer(mockState, {
    playing: false,
    index: 0,
  });

  const currentState = useMemo(() => (
    selectedState ?? (selectedAnimation?.animationType === 'fixed'
      ? selectedAnimation?.states?.fixed
      : (selectedAnimation?.states as Omit<SpriteAnimation['states'], 'fixed'>)
        ?.[selectedStateName || 'idle']
        ?.[selectedDirection || 'up']
    )
  ), [selectedAnimation, selectedState, selectedStateName, selectedDirection]);

  useEffect(() => {
    if (!currentState) {
      return;
    }

    const frames = currentState.frames;
    clearTimeout(playbackTimerRef.current);

    if (state.playing) {
      playbackTimerRef.current = setTimeout(() => {
        dispatch({
          index: (state.index + 1) % frames.length,
        });
      }, typeof frames[state.index] === 'number'
        ? 100
        : (frames[state.index] as SpriteAnimationFrame).duration ?? 100);
    }
  }, [state.playing, state.index, selectedAnimation, currentState]);

  const play = useCallback(() => {
    if (state.playing) {
      return;
    }

    dispatch({ playing: true });
  }, [state.playing]);

  const pause = useCallback(() => {
    if (!state.playing) {
      return;
    }

    dispatch({ playing: false });
  }, [state.playing]);

  const stop = useCallback(() => {
    if (!state.playing) {
      return;
    }

    dispatch({ playing: false, index: 0 });
  }, [state.playing]);

  const jumpToStart = useCallback(() => {
    dispatch({ index: 0 });
  }, []);

  const jumpToEnd = useCallback(() => {
    if (!currentState) {
      return;
    }

    dispatch({ index: currentState.frames.length - 1 });
  }, [currentState]);

  const jumpTo = useCallback((index: number) => {
    if (!currentState) {
      return;
    }

    dispatch({ index: Math.max(0, Math.min(index, currentState.frames.length - 1)) });
  }, [currentState]);

  const getContext = useCallback((): PlaybackContextType => ({
    playing: state.playing,
    index: state.index,
    play,
    pause,
    stop,
    jumpToStart,
    jumpToEnd,
    jumpTo,
  }), [
    state.playing, state.index,
    play, pause, stop, jumpToStart, jumpToEnd, jumpTo,
  ]);

  return (
    <PlaybackContext value={getContext()}>
      { children }
    </PlaybackContext>
  );
};

export default PlaybackProvider;
