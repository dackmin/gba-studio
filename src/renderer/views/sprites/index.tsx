import { useMemo, useRef } from 'react';
import {
  type InfiniteCanvasRef,
  InfiniteCanvas,
  classNames,
} from '@junipero/react';

import type { GameProject, SpriteAnimation } from '../../../types';
import { useEditor, useSprite } from '../../services/hooks';
import FullscreenView from '../../windows/editor/FullscreenView';
import Sprite from '../../components/Sprite';
import Playback from './Playback';

export interface SettingsState {
  project: GameProject;
  selectedConfiguration?: string;
}

const Sprites = () => {
  const infiniteCanvasRef = useRef<InfiniteCanvasRef>(null);
  const { bottomBarHeight } = useEditor();
  const {
    selectedSprite,
    selectedAnimation,
    selectedStateName,
    selectedDirection,
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

  return (
    <FullscreenView>
      <InfiniteCanvas
        ref={infiniteCanvasRef}
        className={classNames(
          'flex-auto overflow-hidden !bg-transparent relative z-10',
        )}
      >
        <div
          className="w-full h-screen flex items-center justify-center"
          style={{
            ...bottomBarHeight && {
              height: `calc(100vh - ${bottomBarHeight}px)`,
            },
          }}
        >
          <Sprite
            scale={4}
            sprite={selectedSprite}
            frames={frames}
            className="border-1 border-green-500"
            animated={true}
          />
        </div>
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

