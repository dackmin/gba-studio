import { Fragment } from 'react';
import { Select } from '@radix-ui/themes';

import { useAssets, usePluginAssets } from '../../services/hooks';
import { getSoundName } from '../../../helpers';

export interface SoundsListFieldProps extends Select.RootProps {}

const SoundsListField = ({
  ...rest
}: SoundsListFieldProps) => {
  const { sounds } = useAssets();
  const pluginSounds = usePluginAssets('sounds');

  return (
    <Select.Root { ...rest }>
      <Select.Trigger placeholder="Select" />
      <Select.Content>
        { sounds.filter(sound => !sound._plugin).map(sound => (
          <Select.Item key={sound.id} value={sound.id || sound.name}>
            { sound.name || getSoundName(sound._file) }
          </Select.Item>
        )) }
        { pluginSounds.map(({ plugin, items }) => (
          <Fragment key={plugin.id}>
            <Select.Separator />
            <Select.Group>
              <Select.Label>{ plugin.name }</Select.Label>
              { items.map(sound => (
                <Select.Item key={sound.id} value={sound.id || sound.name}>
                  { sound.name || getSoundName(sound._file) }
                </Select.Item>
              )) }
            </Select.Group>
          </Fragment>
        )) }
      </Select.Content>
    </Select.Root>
  );
};

export default SoundsListField;
