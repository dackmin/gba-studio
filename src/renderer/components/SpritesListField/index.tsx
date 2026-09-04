import { useMemo } from 'react';
import { Card, DropdownMenu, Text } from '@radix-ui/themes';

import { useApp } from '../../services/hooks';
import { findSprite, getGraphicName } from '../../../helpers';
import Sprite from '../Sprite';

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
    findSprite(sprites, val)
  ), [sprites, val]);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Card className="!cursor-pointer select-none">
          <div className="flex items-center gap-2">
            <Sprite
              sprite={selected ?? {
                path: 'resources://public/templates/commons/graphics/sprite_default.bmp',
                width: 16,
                height: 16,
              }}
              className="w-8 h-8"
              keepAspectRatio
              transparencyColor={selected?.transparentColor}
            />
            <Text>{ selected?.name ?? 'sprite_default' }</Text>
          </div>
        </Card>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item
          onClick={() => onValueChange?.('')}
        >
          <Sprite
            sprite={{
              path: 'resources://public/templates/commons/graphics/sprite_default.bmp',
              width: 16,
              height: 16,
            }}
            className="w-6 h-6"
            keepAspectRatio
          />
          <Text>Default sprite</Text>
        </DropdownMenu.Item>
        { sprites.map(sprite => (
          <DropdownMenu.Item
            key={sprite._file}
            onClick={() => onValueChange?.(sprite.id || sprite.name)}
          >
            <div className="flex items-center gap-2">
              <Sprite
                sprite={sprite}
                className="w-6 h-6"
                keepAspectRatio
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
