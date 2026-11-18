import { Fragment, useMemo } from 'react';
import { Select } from '@radix-ui/themes';

import { useApp, useScripts } from '../../services/hooks';

export interface ScriptsListFieldProps extends Select.RootProps {}

const ScriptsListField = ({
  ...rest
}: ScriptsListFieldProps) => {
  const scripts = useScripts();
  const { plugins } = useApp();
  const projectScripts = useMemo(() => (
    scripts.filter(s => !s._plugin)
  ), [scripts]);
  const pluginScripts = useMemo(() => (
    (plugins ?? [])
      .map(p => ({ plugin: p, items: p._scripts ?? [] }))
      .filter(({ plugin, items }) => plugin.enabled && items.length)
  ), [plugins]);

  return (
    <Select.Root { ...rest }>
      <Select.Trigger placeholder="Select" />
      <Select.Content>
        { projectScripts.map(script => (
          <Select.Item key={script.id} value={script.id}>
            { script.name }
          </Select.Item>
        )) }
        { pluginScripts.map(({ plugin, items }) => (
          <Fragment key={plugin.id}>
            { projectScripts.length > 0 && <Select.Separator /> }
            <Select.Group>
              <Select.Label>{ plugin.name }</Select.Label>
              { items.map(script => (
                <Select.Item key={script.id} value={script.id}>
                  { script.name }
                </Select.Item>
              )) }
            </Select.Group>
          </Fragment>
        )) }
      </Select.Content>
    </Select.Root>
  );
};

export default ScriptsListField;
