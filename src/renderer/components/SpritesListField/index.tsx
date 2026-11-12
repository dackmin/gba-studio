import { Fragment, type ReactNode, useMemo } from 'react';
import { Card, CardProps, DropdownMenu, Text } from '@radix-ui/themes';
import { classNames } from '@junipero/react';

import { useAssets, usePluginAssets } from '../../services/hooks';
import { findSprite } from '../../../helpers';
import Sprite from '../Sprite';
import Item from './Item';

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
  const { sprites } = useAssets();
  const pluginSprites = usePluginAssets('sprites');
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
                <Text>{ selected?.name ?? 'Default sprite' }</Text>
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
        { sprites.filter(sprite => !sprite._plugin).map(sprite => (
          <Item
            key={sprite._file}
            value={sprite}
            onValueChange={onValueChange}
          />
        )) }
        { pluginSprites.map(({ plugin, items }) => (
          <Fragment key={plugin.id}>
            <DropdownMenu.Separator />
            <DropdownMenu.Label>{ plugin.name }</DropdownMenu.Label>
            { items.map(sprite => (
              <Item
                key={sprite._file}
                value={sprite}
                onValueChange={onValueChange}
              />
            )) }
          </Fragment>
        )) }
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default SpritesListField;
