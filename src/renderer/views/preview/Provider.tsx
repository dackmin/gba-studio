import { type ComponentPropsWithoutRef, useCallback, useReducer } from 'react';
import { mockState } from '@junipero/react';

import { type EmulatorContextType, EmulatorContext } from '../../services/contexts';

export interface PreviewProviderState {
  volume: number;
}

const Provider = ({
  children,
}: ComponentPropsWithoutRef<any>) => {
  const [state, dispatch] = useReducer(mockState<PreviewProviderState>, {
    volume: 1,
  });

  const setVolume = useCallback((volume: number) => {
    dispatch({ volume });
  }, []);

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
