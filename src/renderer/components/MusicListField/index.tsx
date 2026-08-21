import { Select } from '@radix-ui/themes';

import { useApp } from '../../services/hooks';
import { getSoundName } from '../../../helpers';

export interface MusicListFieldProps extends Select.RootProps {}

const MusicListField = ({
  ...rest
}: MusicListFieldProps) => {
  const { music } = useApp();

  return (
    <Select.Root
      { ...rest }
    >
      <Select.Trigger placeholder="Select" />
      <Select.Content>
        { music.map(track => (
          <Select.Item key={track.id} value={track.id || track.name}>
            { track.name || getSoundName(track._file) }
          </Select.Item>
        )) }
      </Select.Content>
    </Select.Root>
  );
};

export default MusicListField;
