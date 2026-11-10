import { DropdownMenu, Text } from '@radix-ui/themes';

import type { GameSpriteFile } from '../../../types';
import { getGraphicName } from '../../../helpers';
import Sprite from '../Sprite';

export interface ItemProps {
  value: GameSpriteFile;
  onValueChange?: (value: string) => void;
}

const Item = ({
  value,
  onValueChange,
}: ItemProps) => {
  return (
    <DropdownMenu.Item onClick={onValueChange?.bind(null, value.id || value.name)}>
      <div className="flex items-center gap-2">
        <Sprite
          sprite={value}
          className="w-6 h-6"
          keepAspectRatio
          transparencyColor={value.transparentColor}
        />
        <Text>{ value.name || getGraphicName(value._file) }</Text>
      </div>
    </DropdownMenu.Item>
  );
};

export default Item;
