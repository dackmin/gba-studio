import { useMemo } from 'react';
import { Button, Select, Text } from '@radix-ui/themes';
import { Select as SelectPrimitive } from 'radix-ui';

import { useApp } from '../../services/hooks';
import { findScene } from '../../../helpers';

export interface SceneListFieldProps extends Select.RootProps {
  compact?: boolean;
}

const SceneListField = ({
  compact,
  value,
  ...rest
}: SceneListFieldProps) => {
  const { scenes } = useApp();

  const selected = useMemo(() => (
    findScene(scenes, value)
  ), [scenes, value]);

  return (
    <Select.Root value={selected?.id || value || undefined} { ...rest }>
      { compact ? (
        <SelectPrimitive.Trigger asChild>
          <Button variant="ghost" size="1">
            <SelectPrimitive.Value>
              <Text size="1" className="dark:text-seashell">
                { selected?.name || 'Select Scene' }
              </Text>
            </SelectPrimitive.Value>
          </Button>
        </SelectPrimitive.Trigger>
      ) : (
        <Select.Trigger placeholder="Select" />
      ) }
      <Select.Content>
        { scenes.map(scene => (
          <Select.Item key={scene.id || scene._file} value={scene.id}>
            { scene.name }
          </Select.Item>
        )) }
      </Select.Content>
    </Select.Root>
  );
};

export default SceneListField;
