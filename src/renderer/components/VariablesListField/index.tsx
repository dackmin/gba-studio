import { useMemo } from 'react';
import { Select } from '@radix-ui/themes';

import { useApp } from '../../services/hooks';

export interface VariablesListFieldProps extends Select.RootProps {}

const VariablesListField = ({
  ...rest
}: VariablesListFieldProps) => {
  const { variables: registries } = useApp();

  const variables = useMemo(() => (
    registries.flatMap(r => Object.keys(r.values))
  ), [registries]);

  return (
    <Select.Root
      { ...rest }
    >
      <Select.Trigger placeholder="Select" />
      <Select.Content>
        { variables.map(variable => (
          <Select.Item key={variable} value={variable}>
            { variable }
          </Select.Item>
        )) }
      </Select.Content>
    </Select.Root>
  );
};

export default VariablesListField;
