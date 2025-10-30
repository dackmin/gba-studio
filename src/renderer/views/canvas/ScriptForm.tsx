import { type ChangeEvent, type KeyboardEvent, useCallback } from 'react';
import { Heading, Inset, Separator, Text } from '@radix-ui/themes';
import { classNames, set } from '@junipero/react';

import type { GameScript } from '../../../types';
import EventsField from '../../components/EventsField';

export interface ScriptFormProps {
  script: GameScript;
  onChange?: (script: GameScript) => void;
}

const ScriptForm = ({
  script,
  onChange,
}: ScriptFormProps) => {
  const onNameChange = useCallback((e: ChangeEvent<HTMLHeadingElement>) => {
    const name = (e.currentTarget.textContent || 'Untitled')
      .trim().slice(0, 32);

    if (name === script.name) {
      return;
    }

    set(script, 'name', name);
    onChange?.(script);
  }, [onChange, script]);

  const onNameKeyDown = (e: KeyboardEvent<HTMLHeadingElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const onValueChange = useCallback((name: string, value: any) => {
    set(script, name, value);
    onChange?.(script);
  }, [onChange, script]);

  return (
    <div className="p-3 w-full h-full overflow-x-hidden overflow-y-scroll">
      <Text size="1" className="text-slate">Script</Text>
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
        { script.name }
      </Heading>
      <Inset side="x"><Separator className="!w-full my-4" /></Inset>
      <div className="flex flex-col gap-6">
        <Text className="block text-slate" size="1">Events</Text>
        <Inset>
          <EventsField
            value={script.events ?? []}
            onValueChange={onValueChange.bind(null, 'events')}
          />
        </Inset>
      </div>
    </div>
  );
};

export default ScriptForm;
