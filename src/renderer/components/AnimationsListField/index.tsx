import { Select } from '@radix-ui/themes';

import type { GameSpriteFile } from '../../../types';

export interface AnimationsListFieldProps extends Select.RootProps {
  sprite?: GameSpriteFile;
}

const AnimationsListField = ({
  sprite,
  ...rest
}: AnimationsListFieldProps) => {
  return (
    <Select.Root
      { ...rest }
    >
      <Select.Trigger placeholder="Select" />
      <Select.Content>
        { sprite?.animations?.map(anim => (
          <Select.Item key={anim.id} value={anim.id}>
            { anim.name }
          </Select.Item>
        )) }
      </Select.Content>
    </Select.Root>
  );
};

export default AnimationsListField;
