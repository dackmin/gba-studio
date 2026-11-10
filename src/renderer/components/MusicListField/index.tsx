import { Fragment } from 'react';
import { Select } from '@radix-ui/themes';

import { useAssets, usePluginAssets } from '../../services/hooks';
import { getSoundName } from '../../../helpers';

export interface MusicListFieldProps extends Select.RootProps {}

const MusicListField = ({
  ...rest
}: MusicListFieldProps) => {
  const { music } = useAssets();
  const pluginMusic = usePluginAssets('music');

  return (
    <Select.Root { ...rest }>
      <Select.Trigger placeholder="Select" />
      <Select.Content>
        { music.filter(track => !track._plugin).map(track => (
          <Select.Item key={track.id} value={track.id || track.name}>
            { track.name || getSoundName(track._file) }
          </Select.Item>
        )) }
        { pluginMusic.map(({ plugin, items }) => (
          <Fragment key={plugin.id}>
            <Select.Separator />
            <Select.Group>
              <Select.Label>{ plugin.name }</Select.Label>
              { items.map(track => (
                <Select.Item key={track.id} value={track.id || track.name}>
                  { track.name || getSoundName(track._file) }
                </Select.Item>
              )) }
            </Select.Group>
          </Fragment>
        )) }
      </Select.Content>
    </Select.Root>
  );
};

export default MusicListField;
