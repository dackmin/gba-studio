import { useCallback, useMemo, useRef } from 'react';
import {
  type InfiniteCanvasRef,
  InfiniteCanvas,
  classNames,
  useEventListener,
} from '@junipero/react';

import type { SpriteAnimation } from '../../../types';
import { useApp, useLocalData, useSprite } from '../../services/hooks';
import FullscreenView from '../../windows/editor/FullscreenView';
import Sprite from '../../components/Sprite';
import Background from '../../components/Background';
import Playback from './Playback';

const Images = () => {
  const infiniteCanvasRef = useRef<InfiniteCanvasRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { eventEmitter } = useApp();
  const { isCollapsed, getSize } = useLocalData();
  const {
    selectedSprite,
    selectedBackground,
    selectedAnimation,
    selectedStateName,
    selectedDirection,
    selectSprite,
    selectBackground,
  } = useSprite();

  useEventListener('images:center', () => {
    if (!infiniteCanvasRef.current) {
      return;
    }

    infiniteCanvasRef.current?.centerOn(containerRef.current!, 200);
  }, [eventEmitter], { target: eventEmitter });

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
        cursorMode="pan"
        center={true}
        fitAbsolute={true}
        padding={{
          left: !isCollapsed('leftSidebar') ? getSize('leftSidebarWidth') || 300 : 0,
          bottom: !isCollapsed('bottomBar') ? getSize('bottomBarHeight') || 300 : 0,
          right: !isCollapsed('rightSidebar') ? getSize('rightSidebarWidth') || 300 : 0,
        }}
      >
        <div ref={containerRef}>
          { selectedSprite ? (
            <Sprite
              scale={4}
              sprite={selectedSprite}
              frames={frames}
              className="border-1 border-green-500"
              animated={true}
              transparencyColor={selectedSprite?.transparentColor}
            />
          ) : selectedBackground && (
            <Background
              background={selectedBackground}
            />
          ) }
        </div>
      </InfiniteCanvas>

      <Playback />
    </FullscreenView>
  );
};

export default Images;

export { default as LeftSidebar } from './LeftSidebar';
export { default as RightSidebar } from './RightSidebar';
export { default as BottomBar } from './BottomBar';
export { default as Provider } from './Provider';

