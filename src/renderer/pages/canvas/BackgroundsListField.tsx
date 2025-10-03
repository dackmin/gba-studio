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
        <Card>
          <div className="flex items-center">
            <Avatar
              src={`project://graphics/${val}.bmp`}
              fallback=""
            />
            <div>
              <Text>{ val }</Text>
            </div>
          </div>
        </Card>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        { backgrounds.map(bg => (
          <DropdownMenu.Item
            key={bg._file}
            onClick={() => onValueChange?.(getGraphicName(bg._file))}
          >
            <Avatar
              src={`project://graphics/${getGraphicName(bg._file)}.bmp`}
              fallback=""
            />
            <Text>{ getGraphicName(bg._file) }</Text>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default BackgroundsListField;
