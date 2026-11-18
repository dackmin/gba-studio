import { Fragment, useMemo } from 'react';
import { classNames } from '@junipero/core';
import { Select } from '@radix-ui/themes';

import { useApp, useScriptForm, useVariables } from '../../services/hooks';

export interface VariablesListFieldProps extends Select.RootProps {
  insideField?: boolean;
  includeParameters?: boolean;
}

const VariablesListField = ({
  insideField,
  includeParameters,
  ...rest
}: VariablesListFieldProps) => {
  const registries = useVariables();
  const { plugins } = useApp();
  const { script } = useScriptForm();

  const variables = useMemo(() => (
    registries.filter(r => !r._plugin).flatMap(r => r.values || [])
  ), [registries]);
  const pluginVariables = useMemo(() => (
    (plugins ?? [])
      .filter(p => p.enabled)
      .map(plugin => ({
        plugin,
        items: (plugin._variables ?? []).flatMap(r => r.values || []),
      }))
      .filter(({ items }) => items.length)
  ), [plugins]);
  const parameters = includeParameters ? script?.parameters ?? [] : [];

  return (
    <Select.Root { ...rest } { ...insideField && { size: '1' } }>
      <Select.Trigger
        { ...insideField && {
          variant: 'ghost',
        } }
        className={classNames({
          'px-1.5! [&_.rt-SelectIcon]:hidden': insideField,
        })}
        placeholder="Select"
      />
      <Select.Content>
        { variables.map(variable => (
          <Select.Item key={variable.id} value={variable.id}>
            { variable.name }
          </Select.Item>
        )) }
        { pluginVariables.map(({ plugin, items }, index) => (
          <Fragment key={plugin.id}>
            { (variables.length > 0 || index > 0) && <Select.Separator /> }
            <Select.Group>
              <Select.Label>{ plugin.name }</Select.Label>
              { items.map(variable => (
                <Select.Item key={variable.id} value={variable.id}>
                  { variable._label ?? variable.name }
                </Select.Item>
              )) }
            </Select.Group>
          </Fragment>
        )) }
        { parameters.length > 0 && (
          <>
            { (variables.length > 0 || pluginVariables.length > 0) && (
              <Select.Separator />
            ) }
            <Select.Group>
              <Select.Label>Parameters</Select.Label>
              { parameters.map(parameter => (
                <Select.Item key={parameter.id} value={`param:${parameter.id}`}>
                  { parameter.name }
                </Select.Item>
              )) }
            </Select.Group>
          </>
        ) }
      </Select.Content>
    </Select.Root>
  );
};

export default VariablesListField;
