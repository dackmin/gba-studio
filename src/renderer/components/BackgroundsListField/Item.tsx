import { Avatar, DropdownMenu, Text } from '@radix-ui/themes';

import type { GameBackgroundFile } from '../../../types';
import { getAssetUrl, getGraphicName } from '../../../helpers';

export interface ItemProps {
  value: GameBackgroundFile;
  onValueChange?: (value: string) => void;
}

const Item = ({
  value,
  onValueChange,
}: ItemProps) => {
  return (
    <DropdownMenu.Item
      onClick={onValueChange?.bind(null, value.id || value.name)}
    >
      <div className="flex items-center gap-2">
        <Avatar
          src={getAssetUrl(value)}
          fallback=""
          size="1"
        />
        <Text>{ value.name || getGraphicName(value._file) }</Text>
      </div>
    </DropdownMenu.Item>
  );
};

export default Item;
