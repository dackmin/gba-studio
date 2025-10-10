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

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Card className="!cursor-pointer select-none">
          <div className="flex items-center gap-2">
            <Avatar
              src={`project://graphics/${val}.bmp`}
              fallback=""
            />
            <Text>{ val }</Text>
          </div>
        </Card>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
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
