import { type ChangeEvent, type KeyboardEvent, useCallback } from 'react';
import { Heading, Inset, Separator, Text, TextField } from '@radix-ui/themes';
import { classNames, set } from '@junipero/react';

import type { GameVariable } from '../../../types';

export interface VariableFormProps {
  variable: GameVariable;
  onChange?: (variable: GameVariable) => void;
}

const VariableForm = ({
  variable,
  onChange,
}: VariableFormProps) => {
  const onNameChange = useCallback((e: ChangeEvent<HTMLHeadingElement>) => {
    const name = (e.currentTarget.textContent || 'Untitled')
      .trim().slice(0, 32);

    if (name === variable.name) {
      return;
    }

    set(variable, 'name', name);
    onChange?.(variable);
  }, [onChange, variable]);

  const onNameKeyDown = (e: KeyboardEvent<HTMLHeadingElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const onTextChange = useCallback((
    name: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    set(variable, name, e.currentTarget.value);
    onChange?.(variable);
  }, [onChange, variable]);

  return (
    <div className="p-3 w-full h-full overflow-x-hidden overflow-y-scroll">
      <Text size="1" className="text-slate">Variable</Text>
      <Heading
        contentEditable
        as="h2"
        size="4"
        className={classNames(
          'whitespace-nowrap overflow-scroll focus:outline-2',
          'outline-(--accent-9) rounded-xs editable',
        )}
        onKeyDown={onNameKeyDown}
        onBlur={onNameChange}
        suppressContentEditableWarning
      >
        { variable.name }
      </Heading>
      <Inset side="x"><Separator className="!w-full my-4" /></Inset>
      <div className="flex flex-col gap-2">
        <Text className="block text-slate" size="1">Default value</Text>
        <TextField.Root
          type="text"
          value={'' + (variable.defaultValue ?? '')}
          onChange={onTextChange.bind(null, 'defaultValue')}
        />
      </div>
    </div>
  );
};

export default VariableForm;
