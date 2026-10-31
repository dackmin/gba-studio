import type { ComponentPropsWithoutRef } from 'react';
import { classNames } from '@junipero/react';

import type { CollisionRect } from '../../../types';

export interface CollisionRectOverlayProps extends ComponentPropsWithoutRef<'div'> {
  rect?: CollisionRect;
  scale?: number;
}

const CollisionRectOverlay = ({
  rect,
  scale = 1,
  ...rest
}: CollisionRectOverlayProps) => {
  if (!rect) {
    return null;
  }

  return (
    <div
      { ...rest }
      className={classNames(
        'absolute z-3 pointer-events-none border border-dashed border-red-500',
        'bg-red-500/20'
      )}
      style={{
        left: rect.x * scale,
        top: rect.y * scale,
        width: rect.width * scale,
        height: rect.height * scale,
      }}
    />
  );
};

export default CollisionRectOverlay;
