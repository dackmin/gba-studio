import { type ComponentPropsWithoutRef, useCallback, useReducer } from 'react';
import { mockState } from '@junipero/react';

import { type EmulatorContextType, EmulatorContext } from '../../services/contexts';
import { useLocalData } from '../../services/hooks';

export interface PreviewProviderState {
  volume: number;
}

const Provider = ({
  children,
}: ComponentPropsWithoutRef<any>) => {
  const { emulator, setData } = useLocalData();
  const [state, dispatch] = useReducer(mockState<PreviewProviderState>, {
    volume: emulator?.volume ?? 1,
  });

  const setVolume = useCallback((volume: number) => {
    dispatch({ volume });
    setData('emulator.volume', volume);
  }, [setData]);

  const getContext = useCallback((): EmulatorContextType => ({
    volume: state.volume,
    setVolume,
  }), [state.volume, setVolume]);

  return (
    <EmulatorContext value={getContext()}>
      { children }
    </EmulatorContext>
  );
};

export default Provider;
