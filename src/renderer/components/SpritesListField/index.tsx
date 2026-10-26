import { type ReactNode, useMemo } from 'react';
import { Card, CardProps, DropdownMenu, Text } from '@radix-ui/themes';
import { classNames } from '@junipero/react';

import { useApp } from '../../services/hooks';
import { findSprite, getGraphicName } from '../../../helpers';
import Sprite from '../Sprite';

export interface SpritesListFieldProps extends CardProps {
  value?: string;
  defaultValue?: string;
  nullable?: boolean;
  nullableLabel?: ReactNode;
  defaultGraphic?: string;
  onValueChange?: (value: string) => void;
}

const SpritesListField = ({
  value,
  defaultValue,
  className,
  nullable = false,
  nullableLabel = 'None',
  defaultGraphic = 'sprite_default',
  onValueChange,
}: SpritesListFieldProps) => {
  const { sprites } = useApp();
  const val = value ?? defaultValue ?? '';
  const defaultPath = `resources://public/templates/commons/graphics/${defaultGraphic}.bmp`;

  const selected = useMemo(() => (
    findSprite(sprites, val)
  ), [sprites, val]);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Card className={classNames('!cursor-pointer select-none', className)}>
          <div className="flex items-center gap-2">
            { nullable && !val ? (
              <Text className="text-slate">{ nullableLabel }</Text>
            ) : (
              <>
                <Sprite
                  sprite={selected ?? {
                    path: defaultPath,
                    width: 16,
                    height: 16,
                  }}
                  className="w-8 h-8"
                  keepAspectRatio
                  transparencyColor={selected?.transparentColor}
                />
                <Text>{ selected?.name ?? defaultGraphic }</Text>
              </>
            ) }
          </div>
        </Card>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item
          onClick={() => onValueChange?.('')}
        >
          { nullable ? (
            <Text>{nullableLabel}</Text>
          ) : (
            <>
              <Sprite
                sprite={{
                  path: defaultPath,
                  width: 16,
                  height: 16,
                }}
                className="w-6 h-6"
                keepAspectRatio
              />
              <Text>Default sprite</Text>
            </>
          ) }
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
                transparencyColor={sprite.transparentColor}
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
