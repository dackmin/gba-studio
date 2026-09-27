import { Select, Text } from '@radix-ui/themes';

export interface CollisionGroupFieldProps {
  value?: number;
  onValueChange?: (value: number) => void;
}

// Collision group picker: 0 = no collision, 1-4 = groups. Actors/sprites
// in a group different from the player's are solid and fire their collide
// events when touched.
const CollisionGroupField = ({
  value,
  onValueChange,
}: CollisionGroupFieldProps) => {
  const current = value ?? 0;

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
              { group === 0 ? 'None' : `Group ${group}` }
            </Text>
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
};

export default CollisionGroupField;