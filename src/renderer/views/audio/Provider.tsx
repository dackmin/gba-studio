import { type ComponentPropsWithoutRef, useCallback, useReducer } from 'react';
import { mockState } from '@junipero/react';

import type { GameMusicFile, GameSoundFile } from '../../../types';
import { type AudioContextType, AudioContext } from '../../services/contexts';
import { useApp } from '../../services/hooks';

export interface SpriteState {
  selectedSound?: GameSoundFile;
  selectedMusic?: GameMusicFile;
}

const Provider = ({
  children,
}: ComponentPropsWithoutRef<any>) => {
  const { sounds } = useApp();
  const [state, dispatch] = useReducer(mockState<SpriteState>, {
    selectedSound: sounds?.[0],
    selectedMusic: undefined,
  });

  const selectSound = useCallback((soundFile: GameSoundFile) => {
    if (state.selectedSound === soundFile) {
      return;
    }

    dispatch({
      selectedSound: soundFile,
      selectedMusic: undefined,
    });
  }, [state.selectedSound]);

  const selectMusic = useCallback((musicFile: GameMusicFile) => {
    if (state.selectedMusic === musicFile) {
      return;
    }

    dispatch({
      selectedMusic: musicFile,
      selectedSound: undefined,
    });
  }, [state.selectedMusic]);

  const getContext = useCallback((): AudioContextType => ({
    selectedSound: state.selectedSound,
    selectedMusic: state.selectedMusic,
    selectSound,
    selectMusic,
  }), [
    state.selectedSound,
    state.selectedMusic,
    selectSound,
    selectMusic,
  ]);

  return (
    <AudioContext value={getContext()}>
      { children }
    </AudioContext>
  );
};

export default Provider;
