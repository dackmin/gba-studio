import {
  type ComponentPropsWithoutRef,
  useCallback,
  useMemo,
  useReducer,
} from 'react';
import { mockState } from '@junipero/react';

import { type SpriteContextType, SpriteContext } from '../../services/contexts';
import { useApp } from '../../services/hooks';
import { GameSpriteFile, SpriteAnimation, SpriteAnimations } from '../../../types';


export interface SpriteState {
  selectedSprite?: GameSpriteFile;
  selectedAnimation?: SpriteAnimation;
}

const Provider = ({
  children,
}: ComponentPropsWithoutRef<any>) => {
  const { onCanvasChange, ...appPayload } = useApp();
  const [state, dispatch] = useReducer(mockState<SpriteState>, {
    selectedSprite: undefined,
    selectedAnimation: undefined,
  });

  const selectSprite = useCallback((spriteFile: GameSpriteFile) => {
    if (state.selectedSprite === spriteFile) {
      return;
    }

    dispatch({ selectedSprite: spriteFile });
  }, [state.selectedSprite]);

  const selectAnimation = useCallback((animation: SpriteAnimation) => {
    if (state.selectedAnimation === animation) {
      return;
    }

    dispatch({ selectedAnimation: animation });
  }, [state.selectedAnimation]);

  const onAnimationsChange = useCallback((animations: SpriteAnimations) => {
    onCanvasChange?.({
      ...appPayload,
      animations: appPayload.animations.map(a => {
        if (a._file === animations._file) {
          return animations;
        }

        return a;
      }),
    });
  }, [appPayload, onCanvasChange]);

  const getContext = useCallback((): SpriteContextType => ({
    selectedSprite: state.selectedSprite,
    selectedAnimation: state.selectedAnimation,
    selectSprite,
    selectAnimation,
    onAnimationsChange,
  }), [
    state.selectedSprite,
    state.selectedAnimation,
    selectSprite,
    selectAnimation,
    onAnimationsChange,
  ]);

  return (
    <SpriteContext.Provider value={getContext()}>
      { children }
    </SpriteContext.Provider>
  );
};

export default Provider;
