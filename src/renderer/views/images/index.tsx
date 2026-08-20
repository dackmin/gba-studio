import { useCallback, useMemo, useRef } from 'react';
import {
  type InfiniteCanvasRef,
  InfiniteCanvas,
  classNames,
} from '@junipero/react';

import type { GameProject, SpriteAnimation } from '../../../types';
import { useSprite } from '../../services/hooks';
import FullscreenView from '../../windows/editor/FullscreenView';
import Sprite from '../../components/Sprite';
import Background from '../../components/Background';
import Playback from './Playback';

export interface SettingsState {
  project: GameProject;
  selectedConfiguration?: string;
}

const Sprites = () => {
  const infiniteCanvasRef = useRef<InfiniteCanvasRef>(null);
  const {
    selectedSprite,
    selectedBackground,
    selectedAnimation,
    selectedStateName,
    selectedDirection,
    selectSprite,
    selectBackground,
  } = useSprite();

  const currentState = useMemo(() => (
    selectedAnimation?.animationType === 'fixed'
      ? selectedAnimation?.states?.fixed
      : (selectedAnimation?.states as Omit<SpriteAnimation['states'], 'fixed'>)
        ?.[selectedStateName || 'idle']
        ?.[selectedDirection || 'up']
  ), [selectedAnimation, selectedStateName, selectedDirection]);

  const frames = useMemo(() => (
    currentState?.frames || []
  ), [currentState]);

  const onCanvasClick = useCallback(() => {
    if (selectedSprite) {
      selectSprite?.(selectedSprite);
    } else if (selectedBackground) {
      selectBackground?.(selectedBackground);
    }
  }, [selectedSprite, selectedBackground, selectSprite, selectBackground]);

  return (
    <FullscreenView>
      <InfiniteCanvas
        ref={infiniteCanvasRef}
        className={classNames(
          'flex-auto overflow-hidden !bg-transparent relative z-10',
        )}
        onClick={onCanvasClick}
      >
        { selectedSprite ? (
          <Sprite
            scale={4}
            sprite={selectedSprite}
            frames={frames}
            className="border-1 border-green-500"
            animated={true}
          />
        ) : selectedBackground && (
          <Background
            background={selectedBackground}
          />
        )}
      </InfiniteCanvas>

      <Playback />
    </FullscreenView>
  );
};

export default Sprites;

export { default as LeftSidebar } from './LeftSidebar';
export { default as RightSidebar } from './RightSidebar';
export { default as BottomBar } from './BottomBar';
export { default as Provider } from './Provider';

