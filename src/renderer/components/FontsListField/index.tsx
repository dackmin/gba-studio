import { Fragment, useCallback, useMemo } from 'react';
import { Select } from '@radix-ui/themes';

import { findFont, getGraphicName } from '../../../helpers';
import { useApp, useAssets, usePluginAssets } from '../../services/hooks';

export interface FontsListFieldProps extends Select.RootProps {
  className?: string;
}

const DEFAULT_FONT_VALUE = '__default__';

const FontsListField = ({
  className,
  value,
  onValueChange,
  ...rest
}: FontsListFieldProps) => {
  const { project } = useApp();
  const { fonts } = useAssets();
  const pluginFonts = usePluginAssets('fonts');
  const globalFont = useMemo(() => (
    findFont(fonts, project?.settings?.font)
  ), [fonts, project?.settings?.font]);

  const onValueChange_ = useCallback((val: string) => {
    onValueChange?.(val === DEFAULT_FONT_VALUE ? '' : val);
  }, [onValueChange]);

  return (
    <Select.Root
      { ...rest }
      value={value || DEFAULT_FONT_VALUE}
      onValueChange={onValueChange_}
    >
      <Select.Trigger className={className} placeholder="Select" />
      <Select.Content>
        <Select.Item value={DEFAULT_FONT_VALUE}>
          { globalFont
            ? `${globalFont.name} (project font)`
            : 'GBS Mono (default)' }
        </Select.Item>
        { fonts.filter(font => !font._plugin).map(font => (
          <Select.Item
            key={font._file}
            value={font.id || font.name}
          >
            { font.name || getGraphicName(font._file) }
          </Select.Item>
        )) }
        { pluginFonts.map(({ plugin, items }) => (
          <Fragment key={plugin.id}>
            <Select.Separator />
            <Select.Group>
              <Select.Label>{ plugin.name }</Select.Label>
              { items.map(font => (
                <Select.Item
                  key={font._file}
                  value={font.id || font.name}
                >
                  { font.name || getGraphicName(font._file) }
                </Select.Item>
              )) }
            </Select.Group>
          </Fragment>
        )) }
      </Select.Content>
    </Select.Root>
  );
};

export default FontsListField;
