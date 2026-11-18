import { useMemo } from 'react';
import { Select, Text } from '@radix-ui/themes';

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
    <Select.Root size={compact ? '1' : undefined} value={selected?.id || value || undefined} { ...rest }>
      { compact ? (
        <Select.Trigger variant="ghost" className="[&_.rt-SelectIcon]:hidden">
          <Text size="1" className="dark:text-seashell">
            { selected?.name || 'Select Scene' }
          </Text>
        </Select.Trigger>
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
