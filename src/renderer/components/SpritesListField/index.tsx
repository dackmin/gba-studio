import { useMemo } from 'react';
import { Avatar, Card, DropdownMenu, Text } from '@radix-ui/themes';

import { useApp } from '../../services/hooks';
import { getGraphicName } from '../../../helpers';

export interface SpritesListFieldProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

const SpritesListField = ({
  value,
  defaultValue,
  onValueChange,
}: SpritesListFieldProps) => {
  const { sprites } = useApp();
  const val = value ?? defaultValue ?? '';

  const selected = useMemo(() => (
    sprites.find(sprite => sprite.id === val || sprite.name === val)
  ), [sprites, val]);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Card className="!cursor-pointer select-none">
          <div className="flex items-center gap-2">
            <Avatar
              src={!val || val === 'sprite_default' || !selected
                ? `resources://public/templates` +
                  `/commons/graphics/sprite_default.bmp`
                : `project://${selected.path}`}
              fallback=""
              className="[&>img]:pixelated"
            />
            <Text>{ selected?.name ?? 'sprite_default' }</Text>
          </div>
        </Card>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item
          onClick={() => onValueChange?.('')}
        >
          <Avatar
            src={`resources://public/templates` +
              `/commons/graphics/sprite_default.bmp`}
            fallback=""
            size="1"
            className="[&>img]:pixelated"
          />
          <Text>Default sprite</Text>
        </DropdownMenu.Item>
        { sprites.map(sprite => (
          <DropdownMenu.Item
            key={sprite._file}
            onClick={() => onValueChange?.(sprite.id || sprite.name)}
          >
            <div className="flex items-center gap-2">
              <Avatar
                src={`project://${sprite.path}`}
                fallback=""
                size="1"
                className="[&>img]:pixelated"
              />
              <Text>{ sprite.name || getGraphicName(sprite._file) }</Text>
            </div>
          </DropdownMenu.Item>
        )) }
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default SpritesListField;
