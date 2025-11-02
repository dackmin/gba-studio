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
  const { sprites, resourcesPath } = useApp();
  const val = value ?? defaultValue;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Card className="!cursor-pointer select-none">
          <div className="flex items-center gap-2">
            <Avatar
              src={!val
                ? `file://${resourcesPath}public/templates` +
                  `/commons/graphics/sprite_default.bmp`
                : `project://graphics/${val}.bmp`}
              fallback=""
              className="[&>img]:pixelated"
            />
            <Text>{ val ?? 'sprite_default' }</Text>
          </div>
        </Card>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item
          onClick={() => onValueChange?.('')}
        >
          <Avatar
            src={`file://${resourcesPath}public/templates` +
              `/commons/graphics/sprite_default.bmp`}
            fallback=""
            size="1"
            className="[&>img]:pixelated"
          />
          <Text>sprite_default</Text>
        </DropdownMenu.Item>
        { sprites.map(sprite => (
          <DropdownMenu.Item
            key={sprite._file}
            onClick={() => onValueChange?.(getGraphicName(sprite._file))}
          >
            <div className="flex items-center gap-2">
              <Avatar
                src={`project://graphics/${getGraphicName(sprite._file)}.bmp`}
                fallback=""
                size="1"
                className="[&>img]:pixelated"
              />
              <Text>{ getGraphicName(sprite._file) }</Text>
            </div>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default SpritesListField;
