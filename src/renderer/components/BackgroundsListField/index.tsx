import { Fragment, useMemo } from 'react';
import { Avatar, Card, DropdownMenu, Text } from '@radix-ui/themes';

import { useAssets, usePluginAssets } from '../../services/hooks';
import { findBackground, getAssetUrl } from '../../../helpers';
import Item from './Item';

export interface BackgroundsListFieldProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

const BackgroundsListField = ({
  value,
  defaultValue,
  onValueChange,
}: BackgroundsListFieldProps) => {
  const { backgrounds } = useAssets();
  const pluginBackgrounds = usePluginAssets('backgrounds');
  const val = value ?? defaultValue ?? '';

  const selected = useMemo(() => (
    findBackground(backgrounds, val)
  ), [backgrounds, val]);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Card className="!cursor-pointer select-none">
          <div className="flex items-center gap-2">
            <Avatar
              src={!val || val === 'bg_default' || !selected
                ? `resources://public/templates/commons/graphics/bg_default.bmp`
                : getAssetUrl(selected)}
              fallback=""
            />
            <Text>{ selected?.name ?? 'Default background' }</Text>
          </div>
        </Card>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item onClick={onValueChange?.bind(null, '')}>
          <div className="flex items-center gap-2">
            <Avatar
              src={`resources://public/templates` +
                `/commons/graphics/bg_default.bmp`}
              fallback=""
              size="1"
            />
            <Text>Default background</Text>
          </div>
        </DropdownMenu.Item>
        { backgrounds.filter(bg => !bg._plugin).map(bg => (
          <Item
            key={bg._file}
            value={bg}
            onValueChange={onValueChange}
          />
        )) }
        { pluginBackgrounds.map(({ plugin, items }) => (
          <Fragment key={plugin.id}>
            <DropdownMenu.Separator />
            <DropdownMenu.Label>{ plugin.name }</DropdownMenu.Label>
            { items.map(bg => (
              <Item
                key={bg._file}
                value={bg}
                onValueChange={onValueChange}
              />
            )) }
          </Fragment>
        )) }
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default BackgroundsListField;
