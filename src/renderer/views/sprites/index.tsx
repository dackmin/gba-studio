import { useRef } from 'react';
import {
  type InfiniteCanvasRef,
  InfiniteCanvas,
  classNames,
} from '@junipero/react';

import type { GameProject } from '../../../types';
import { useEditor, useSprite } from '../../services/hooks';
import FullscreenView from '../../windows/editor/FullscreenView';
import Sprite from '../../components/Sprite';

export interface SettingsState {
  project: GameProject;
  selectedConfiguration?: string;
}

const Sprites = () => {
  const infiniteCanvasRef = useRef<InfiniteCanvasRef>(null);
  const { bottomBarHeight } = useEditor();
  const { selectedSprite } = useSprite();

  return (
    <FullscreenView>
      <InfiniteCanvas
        ref={infiniteCanvasRef}
        className={classNames(
          'flex-auto overflow-hidden !bg-transparent',
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
            className="border-1 border-green-500"
          />
        </div>
      </InfiniteCanvas>
    </FullscreenView>
  );
};

export default Sprites;

export { default as LeftSidebar } from './LeftSidebar';
export { default as RightSidebar } from './RightSidebar';
export { default as BottomBar } from './BottomBar';
export { default as Provider } from './Provider';

