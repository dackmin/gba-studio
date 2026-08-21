import { Select } from '@radix-ui/themes';

import { useApp } from '../../services/hooks';
import { getSoundName } from '../../../helpers';

export interface SoundsListFieldProps extends Select.RootProps {}

const SoundsListField = ({
  ...rest
}: SoundsListFieldProps) => {
  const { sounds } = useApp();

  return (
    <Select.Root
      { ...rest }
    >
      <Select.Trigger placeholder="Select" />
      <Select.Content>
        { sounds.map(sound => (
          <Select.Item key={sound.id} value={sound.id || sound.name}>
            { sound.name || getSoundName(sound._file) }
          </Select.Item>
        )) }
      </Select.Content>
    </Select.Root>
  );
};

export default SoundsListField;
