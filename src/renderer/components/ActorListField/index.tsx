import { Button, Select, Text } from '@radix-ui/themes';
import { Select as SelectPrimitive } from 'radix-ui';

import { useCanvas, useSceneForm } from '../../services/hooks';

export interface ActorListFieldProps extends Select.RootProps {
  compact?: boolean;
}

const ActorListField = ({
  compact,
  value,
  ...rest
}: ActorListFieldProps) => {
  const { scene, script } = useSceneForm();
  const { selectedScene, selectedItem } = useCanvas();
  const actors = (scene ?? selectedScene)?.actors ?? [];
  const selectedParameter = (script?.parameters ?? []).find(parameter => (
    `__script_param_${parameter.id}` === value
  ));

  return (
    <Select.Root value={value} { ...rest }>
      { compact ? (
        <SelectPrimitive.Trigger asChild>
          <Button variant="ghost" size="1">
            <SelectPrimitive.Value>
              <Text size="1" className="dark:text-seashell">
                { actors.find(actor => actor.id === value)?.name ||
                  selectedParameter?.name || 'Select Actor' }
              </Text>
            </SelectPrimitive.Value>
          </Button>
        </SelectPrimitive.Trigger>
      ) : (
        <Select.Trigger placeholder="Select Actor" />
      ) }
      <Select.Content>
        { actors.map(actor => (
          <Select.Item key={actor.id} value={actor.id}>
            { actor.name }
            { selectedItem?.type === 'actor' && selectedItem.id === actor.id
              ? ' (this actor)' : '' }
          </Select.Item>
        )) }
        { (script?.parameters ?? [])
          .filter(parameter => parameter.type === 'actor')
          .map(parameter => (
            <Select.Item
              key={parameter.id}
              value={`__script_param_${parameter.id}`}
            >
              { parameter.name } (parameter)
            </Select.Item>
          )) }
      </Select.Content>
    </Select.Root>
  );
};

export default ActorListField;
