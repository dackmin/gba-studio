import { useMemo } from 'react';
import { SegmentedControl } from '@radix-ui/themes';
import { classNames } from '@junipero/react';

import type { GameScene } from '../../../types';

export interface CollisionGroupFieldProps
  extends Omit<SegmentedControl.RootProps, 'value' | 'onValueChange'> {
  value?: number;
  sceneType?: GameScene['sceneType'];
  onValueChange?: (value: number) => void;
}

// Collision group picker: 0 = no group, 1-4 = groups. The behavior of 0
// depends on the scene type: in top-down, adventure and point-and-click scenes actors
// in no group are solid by default (the historical behavior), in side-scroller scenes
// they are pass-through (groups are opt-in obstacles/enemies). In both
// types, an actor in the same group as the player is pass-through, and
// different groups are solid and fire their collide events on touch.
const CollisionGroupField = ({
  value,
  sceneType,
  className,
  onValueChange,
}: CollisionGroupFieldProps) => {
  const current = value ?? 0;
  const topDown = useMemo(() => (
    ['2d-top-down', 'point-and-click', 'adventure'].includes(sceneType || 'logos')
  ), [sceneType]);

  return (
    <SegmentedControl.Root
      value={'' + current}
      className={classNames(
        '[&_span]:!px-0',
        className,
      )}
    >
      { [0, 1, 2, 3, 4].map(group => (
        <SegmentedControl.Item
          key={group}
          value={'' + group}
          onClick={onValueChange?.bind(null, group)}
        >
          { group === 0
            ? (topDown ? 'None (solid)' : 'None')
            : group }
        </SegmentedControl.Item>
      )) }
    </SegmentedControl.Root>
  );
};

export default CollisionGroupField;
