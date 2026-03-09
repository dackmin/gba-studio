import {
  type ComponentPropsWithoutRef,
  useCallback,
  useMemo,
  useReducer,
} from 'react';
import { mockState } from '@junipero/react';

import type {
  GameSpriteFile,
  SpriteAnimation,
  SpriteAnimations,
  SpriteAnimationState,
} from '../../../types';
import {
  type SpriteContextType,
  SpriteContext,
} from '../../services/contexts';
import { useApp } from '../../services/hooks';


export interface SpriteState {
  selectedSprite?: GameSpriteFile;
  selectedAnimation?: SpriteAnimation;
  selectedState?: SpriteAnimationState;
}

const Provider = ({
  children,
}: ComponentPropsWithoutRef<any>) => {
  const { sprites, animations } = useApp();
  const { onCanvasChange, ...appPayload } = useApp();
  const [state, dispatch] = useReducer(mockState<SpriteState>, {
    selectedSprite: sprites[0],
    selectedAnimation: undefined,
    selectedState: undefined,
  });

  const animationsRegistry = useMemo(() => (
    animations.find(a => a._sprite_file === state.selectedSprite?._file)
  ), [animations, state.selectedSprite]);

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

  const selectState = useCallback((s: SpriteAnimationState) => {
    if (state.selectedState === s) {
      return;
    }

    dispatch({ selectedState: s });
  }, [state.selectedState]);

  const onAnimationsChange = useCallback((
    animationRegistry: SpriteAnimations
  ) => {
    onCanvasChange?.({
      ...appPayload,
      animations: appPayload.animations
        .findIndex(a => a._file === animationRegistry._file) === -1
        ? [...appPayload.animations, animationRegistry]
        : appPayload.animations.map(a =>
          a._file === animationRegistry._file ? animationRegistry : a
        ),
    });
  }, [appPayload, onCanvasChange]);

  const getContext = useCallback((): SpriteContextType => ({
    selectedSprite: state.selectedSprite,
    selectedAnimation: state.selectedAnimation,
    selectedState: state.selectedState,
    animationsRegistry,
    selectSprite,
    selectAnimation,
    selectState,
    onAnimationsChange,
  }), [
    state.selectedSprite,
    state.selectedAnimation,
    state.selectedState,
    animationsRegistry,
    selectSprite,
    selectAnimation,
    selectState,
    onAnimationsChange,
  ]);

  return (
    <SpriteContext.Provider value={getContext()}>
      { children }
    </SpriteContext.Provider>
  );
};

export default Provider;
