import { useCallback, useMemo, useRef } from 'react';
import {
  type InfiniteCanvasRef,
  InfiniteCanvas,
  classNames,
  useEventListener,
} from '@junipero/react';

import type { SpriteAnimation } from '../../../types';
import { getAssetUrl } from '../../../helpers';
import { useApp, useLocalData, useSprite } from '../../services/hooks';
import { hexToRgb } from '../../services/helpers';
import FullscreenView from '../../windows/editor/FullscreenView';
import Sprite from '../../components/Sprite';
import Background from '../../components/Background';
import PixelText, { getTextWidth } from '../../components/PixelText';
import Playback from './Playback';

const SAMPLE_TEXTS = [
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  'abcdefghijklmnopqrstuvwxyz',
  '0123456789 !?.:',
];

const Images = () => {
  const infiniteCanvasRef = useRef<InfiniteCanvasRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { eventEmitter } = useApp();
  const { isCollapsed, getSize } = useLocalData();
  const {
    selectedSprite,
    selectedBackground,
    selectedFont,
    selectedAnimation,
    selectedStateName,
    selectedDirection,
    selectSprite,
    selectBackground,
    selectFont,
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
    } else if (selectedFont) {
      selectFont?.(selectedFont);
    }
  }, [
    selectedSprite, selectedBackground, selectedFont,
    selectSprite, selectBackground, selectFont,
  ]);

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
          ) : selectedBackground ? (
            <Background
              background={selectedBackground}
            />
          ) : selectedFont && (
            <div className="flex flex-col gap-2 border-1 border-green-500 p-2">
              { SAMPLE_TEXTS.map(line => (
                <PixelText
                  key={line}
                  text={line}
                  color="#000"
                  fontUrl={getAssetUrl(selectedFont)}
                  glyphHeight={selectedFont.height || 8}
                  transparencyColor={
                    selectedFont.transparentColor
                      ? hexToRgb(selectedFont.transparentColor)
                      : [0, 255, 0]
                  }
                  className="pixelated"
                  style={{
                    width: getTextWidth(line) * 4,
                    height: (selectedFont.height || 8) * 4,
                  }}
                />
              )) }
            </div>
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

