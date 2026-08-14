import {
  type ComponentPropsWithoutRef,
  useCallback,
  useReducer,
} from 'react';
import { mockState } from '@junipero/react';
import { v4 as uuid } from 'uuid';

import type {
  CharacterDirection,
  GameBackgroundFile,
  GameSpriteFile,
  SpriteAnimation,
  SpriteAnimationFrame,
  SpriteAnimationState,
} from '../../../types';
import {
  type SpriteContextType,
  SpriteContext,
} from '../../services/contexts';
import { useApp } from '../../services/hooks';
import PlaybackProvider from './PlaybackProvider';

export interface SpriteState {
  selectedSprite?: GameSpriteFile;
  selectedBackground?: GameBackgroundFile;
  selectedAnimation?: SpriteAnimation;
  selectedStateName?: Exclude<keyof SpriteAnimation['states'], 'fixed'>;
  selectedDirection?: CharacterDirection;
  selectedState?: SpriteAnimationState;
  selectedFrame?: SpriteAnimationFrame;
}

const Provider = ({
  children,
}: ComponentPropsWithoutRef<any>) => {
  const { sprites } = useApp();
  const { onCanvasChange, ...appPayload } = useApp();
  const [state, dispatch] = useReducer(mockState<SpriteState>, {
    selectedSprite: sprites?.[0],
    selectedBackground: undefined,
    selectedAnimation: sprites?.[0]?.animations?.[0],
    selectedStateName: undefined,
    selectedDirection: undefined,
    selectedState: undefined,
    selectedFrame: undefined,
  });

  const selectSprite = useCallback((spriteFile: GameSpriteFile) => {
    if (state.selectedSprite === spriteFile) {
      dispatch({ selectedFrame: undefined });

      return;
    }

    dispatch({
      selectedSprite: spriteFile,
      selectedAnimation: spriteFile?.animations?.[0],
      selectedBackground: undefined,
      selectedStateName: undefined,
      selectedDirection: undefined,
      selectedState: undefined,
      selectedFrame: undefined,
    });
  }, [state.selectedSprite]);

  const selectBackground = useCallback((backgroundFile: GameBackgroundFile) => {
    if (state.selectedBackground === backgroundFile) {
      return;
    }

    dispatch({
      selectedBackground: backgroundFile,
      selectedAnimation: undefined,
      selectedState: undefined,
      selectedFrame: undefined,
      selectedSprite: undefined,
    });
  }, [state.selectedBackground]);

  const selectAnimation = useCallback((animation?: SpriteAnimation) => {
    if (state.selectedAnimation === animation) {
      return;
    }

    dispatch({ selectedAnimation: animation });
  }, [state.selectedAnimation]);

  const selectStateName = useCallback((
    stateName: Exclude<keyof SpriteAnimation['states'], 'fixed'>
  ) => {
    if (state.selectedStateName === stateName) {
      return;
    }

    dispatch({ selectedStateName: stateName });
  }, [state.selectedStateName]);

  const selectDirection = useCallback((direction: CharacterDirection) => {
    if (state.selectedDirection === direction) {
      return;
    }

    dispatch({ selectedDirection: direction });
  }, [state.selectedDirection]);

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
    sprite: GameSpriteFile,
  ) => {
    onCanvasChange?.({
      ...appPayload,
      sprites: appPayload.sprites.map(s => (
        s._file === sprite._file ? sprite : s
      )),
    });

    if (state.selectedAnimation) {
      const newSelectedAnimation = sprite.animations?.find(a => (
        a.id === state.selectedAnimation!.id
      ));

      dispatch({
        selectedAnimation: newSelectedAnimation ??
          sprite.animations?.[0],
        ...(!newSelectedAnimation && {
          selectedState: undefined,
          selectedFrame: undefined,
        }),
      });
    }
  }, [appPayload, onCanvasChange, state.selectedAnimation]);

  const onAddAnimation = useCallback(() => {
    const newAnimation: SpriteAnimation = {
      type: 'animation',
      name: 'New Animation',
      animationType: 'fixed',
      states: {},
      // Internals
      id: uuid(),
    };

    onAnimationsChange?.({
      ...state.selectedSprite!,
      animations: [
        ...(state.selectedSprite?.animations || []),
        newAnimation,
      ],
    });

    selectAnimation?.(newAnimation);
  }, [
    state.selectedSprite,
    onAnimationsChange, selectAnimation,
  ]);

  const onRemoveAnimation = useCallback((animation: SpriteAnimation) => {
    if (!state.selectedSprite) {
      return;
    }

    onAnimationsChange?.({
      ...state.selectedSprite,
      animations: state.selectedSprite.animations?.filter(a => (
        a.id !== animation.id
      )),
    });

    if (state.selectedAnimation?.id === animation.id) {
      selectAnimation?.(undefined);
    }
  }, [
    state.selectedSprite, state.selectedAnimation,
    onAnimationsChange, selectAnimation,
  ]);

  const getContext = useCallback((): SpriteContextType => ({
    selectedSprite: state.selectedSprite,
    selectedBackground: state.selectedBackground,
    selectedAnimation: state.selectedAnimation,
    selectedState: state.selectedState,
    selectedFrame: state.selectedFrame,
    selectedStateName: state.selectedStateName,
    selectedDirection: state.selectedDirection,
    selectSprite,
    selectBackground,
    selectAnimation,
    selectState,
    selectFrame,
    selectStateName,
    selectDirection,
    onAnimationsChange,
    onAddAnimation,
    onRemoveAnimation,
  }), [
    state.selectedSprite,
    state.selectedBackground,
    state.selectedAnimation,
    state.selectedState,
    state.selectedFrame,
    state.selectedDirection,
    state.selectedStateName,
    selectSprite,
    selectBackground,
    selectAnimation,
    selectState,
    selectFrame,
    selectStateName,
    selectDirection,
    onAnimationsChange,
    onAddAnimation,
    onRemoveAnimation,
  ]);

  return (
    <SpriteContext value={getContext()}>
      <PlaybackProvider>
        { children }
      </PlaybackProvider>
    </SpriteContext>
  );
};

export default Provider;
