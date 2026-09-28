import { Select, Text } from '@radix-ui/themes';

import type { GameScene } from '../../../types';

export interface CollisionGroupFieldProps {
  value?: number;
  sceneType?: GameScene['sceneType'];
  onValueChange?: (value: number) => void;
}

// Collision group picker: 0 = no group, 1-4 = groups. The behavior of 0
// depends on the scene type: in top-down scenes actors in no group are
// solid by default (the historical behavior), in side-scroller scenes
// they are pass-through (groups are opt-in obstacles/enemies). In both
// types, an actor in the same group as the player is pass-through, and
// different groups are solid and fire their collide events on touch.
const CollisionGroupField = ({
  value,
  sceneType,
  onValueChange,
}: CollisionGroupFieldProps) => {
  const current = value ?? 0;
  const topDown = sceneType === '2d-top-down';

  return (
    <Select.Root
      size="1"
      value={String(current)}
      onValueChange={(v: string) => onValueChange?.(Number(v))}
    >
      <Select.Trigger className="w-full" />
      <Select.Content>
        {[0, 1, 2, 3, 4].map(group => (
          <Select.Item key={group} value={String(group)}>
            <Text>
              { group === 0
                ? (topDown ? 'None (solid)' : 'None')
                : `Group ${group}` }
            </Text>
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
};

export default CollisionGroupField;
