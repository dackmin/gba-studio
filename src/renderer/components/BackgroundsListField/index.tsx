import { Avatar, Card, DropdownMenu, Text } from '@radix-ui/themes';

import { useApp } from '../../services/hooks';
import { getGraphicName } from '../../../helpers';

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
        { backgrounds.map(bg => (
          <DropdownMenu.Item
            key={bg._file}
            onClick={() => onValueChange?.(getGraphicName(bg._file))}
          >
            <div className="flex items-center gap-2">
              <Avatar
                src={`project://graphics/${getGraphicName(bg._file)}.bmp`}
                fallback=""
                size="1"
              />
              <Text>{ getGraphicName(bg._file) }</Text>
            </div>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default BackgroundsListField;
