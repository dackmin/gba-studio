import { useMemo } from 'react';
import { Avatar, Card, DropdownMenu, Text } from '@radix-ui/themes';

import { useApp } from '../../services/hooks';
import { findBackground, getGraphicName } from '../../../helpers';

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
  const { backgrounds } = useApp();
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
                : `project://${selected?.path}`}
              fallback=""
            />
            <Text>{ selected?.name ?? 'Default background' }</Text>
          </div>
        </Card>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item
          onClick={() => onValueChange?.('')}
        >
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
        { backgrounds.map(bg => (
          <DropdownMenu.Item
            key={bg._file}
            onClick={() => onValueChange?.(bg.id || bg.name)}
          >
            <div className="flex items-center gap-2">
              <Avatar
                src={`project://${bg.path}`}
                fallback=""
                size="1"
              />
              <Text>{ bg.name || getGraphicName(bg._file) }</Text>
            </div>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default BackgroundsListField;
