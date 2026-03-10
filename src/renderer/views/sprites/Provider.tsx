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
  SpriteAnimationFrame,
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
  selectedFrame?: SpriteAnimationFrame;
}

const Provider = ({
  children,
}: ComponentPropsWithoutRef<any>) => {
  const { sprites, animations } = useApp();
  const { onCanvasChange, ...appPayload } = useApp();
  const [state, dispatch] = useReducer(mockState<SpriteState>, {
    selectedSprite: sprites?.[0],
    selectedAnimation: animations
      ?.find(a => a._sprite_file === sprites?.[0]?._file)
      ?.animations?.[0],
    selectedState: undefined,
    selectedFrame: undefined,
  });

  const animationsRegistry = useMemo(() => (
    animations.find(a => a._sprite_file === state.selectedSprite?._file)
  ), [animations, state.selectedSprite]);

  const selectSprite = useCallback((spriteFile: GameSpriteFile) => {
    if (state.selectedSprite === spriteFile) {
      dispatch({ selectedFrame: undefined });

      return;
    }

    dispatch({
      selectedSprite: spriteFile,
      selectedAnimation: animations
        ?.find(a => a._sprite_file === spriteFile._file)
        ?.animations?.[0],
      selectedState: undefined,
      selectedFrame: undefined,
    });
  }, [state.selectedSprite, animations]);

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

  const selectFrame = useCallback((f: SpriteAnimationFrame) => {
    if (state.selectedFrame && state.selectedFrame === f) {
      return;
    }

    dispatch({ selectedFrame: f });
  }, [state.selectedFrame]);

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

    if (state.selectedAnimation) {
      const newSelectedAnimation = animationRegistry.animations.find(a => (
        a.id === state.selectedAnimation!.id
      ));

      if (newSelectedAnimation) {
        dispatch({ selectedAnimation: newSelectedAnimation });
      }
    }
  }, [appPayload, onCanvasChange, state.selectedAnimation]);

  const getContext = useCallback((): SpriteContextType => ({
    selectedSprite: state.selectedSprite,
    selectedAnimation: state.selectedAnimation,
    selectedState: state.selectedState,
    selectedFrame: state.selectedFrame,
    animationsRegistry,
    selectSprite,
    selectAnimation,
    selectState,
    selectFrame,
    onAnimationsChange,
  }), [
    state.selectedSprite,
    state.selectedAnimation,
    state.selectedState,
    state.selectedFrame,
    animationsRegistry,
    selectSprite,
    selectAnimation,
    selectState,
    selectFrame,
    onAnimationsChange,
  ]);

  return (
    <SpriteContext.Provider value={getContext()}>
      { children }
    </SpriteContext.Provider>
  );
};

export default Provider;
