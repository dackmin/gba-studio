import { type MouseEvent, useCallback } from 'react';
import {
  type MoveableProps,
  classNames,
  Moveable,
  useInfiniteCanvas,
} from '@junipero/react';

import type { GameScene } from '../../../types';
import { findSprite, tileToPixel } from '../../../helpers';
import { useApp, useCanvas } from '../../services/hooks';
import Sprite from '../../components/Sprite';

export interface PlayerStartProps extends MoveableProps {
  scene: GameScene;
  gridSize?: number;
  onSelect?: (e: MouseEvent<HTMLElement>) => void;
}

const PlayerStart = ({
  scene,
  gridSize = 16,
  onMoveEnd,
  onSelect,
  ...rest
}: PlayerStartProps) => {
  const { zoom } = useInfiniteCanvas();
  const { tool, selectedItem } = useCanvas();
  const { sprites } = useApp();

  const onSelect_ = useCallback((e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    onSelect?.(e);
  }, [onSelect]);

  const getSprite = useCallback((name?: string) => (
    findSprite(sprites, name)
  ), [sprites]);

  if (!scene.player) {
    return null;
  }

  return (
    <Moveable
      { ...rest }
      transformScale={zoom}
      x={tileToPixel(scene.player.x || 0, gridSize)}
      y={tileToPixel(scene.player.y || 0, gridSize)}
      disabled={tool !== 'default' || selectedItem !== scene.player}
      onMouseDown={onSelect_}
      onMoveEnd={onMoveEnd}
      step={gridSize}
      style={{
        left: 0,
        top: 0,
        width: scene.player.width
          ? tileToPixel(scene.player.width, gridSize)
          : getSprite(scene.player.sprite || 'sprite_default')
            ?.width ?? gridSize,
        height: scene.player.height
          ? tileToPixel(scene.player.height, gridSize)
          : getSprite(scene.player.sprite || 'sprite_default')
            ?.height ?? gridSize,
      }}
    >
      <div className="absolute w-full h-full">
        <div className="relative w-full h-full">
          <div
            className={classNames(
              'absolute hover:border-1 border-(--accent-9)',
              'z-2 w-full h-full top-0 left-0',
              { 'border-1': selectedItem === scene.player }
            )}
          />
          <Sprite
            className="absolute z-1 top-0 left-0 pixelated"
            sprite={getSprite(scene.player.sprite || 'sprite_default')}
            width={scene.player.width}
            height={scene.player.height}
            direction={scene.player.direction}
            gridSize={gridSize}
          />
        </div>
      </div>
    </Moveable>
  );
};

export default PlayerStart;
