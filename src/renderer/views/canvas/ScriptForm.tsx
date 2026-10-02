import { type ChangeEvent, type KeyboardEvent, useCallback } from 'react';
import { Button, Heading, Inset, ScrollArea, Separator, Text } from '@radix-ui/themes';
import { classNames, set } from '@junipero/react';

import type { GameScript } from '../../../types';
import { useApp } from '../../services/hooks';
import EventsField from '../../components/EventsField';

export interface ScriptFormProps {
  script: GameScript;
  onChange?: (script: GameScript) => void;
}

const ScriptForm = ({
  script,
  onChange,
}: ScriptFormProps) => {
  const { projectPath } = useApp();

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

  const onRenameFile = useCallback(async () => {
    const newFileName = await window.electron.renameScriptFile(
      projectPath,
      script._file || 'script_1.json',
      script,
    );

    if (!newFileName || newFileName === script._file) {
      return;
    }

    onChange?.({ ...script, _file: newFileName });
  }, [projectPath, script, onChange]);

  const openParentFolder = useCallback(async () => {
    if (!script._file) {
      return;
    }

    await window.electron.openParentFolder(
      projectPath,
      `project://content/${script._file}`
    );
  }, [projectPath, script._file]);

  return (
    <ScrollArea scrollbars="vertical">
      <div className="p-3">
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
        <div>
          <Text size="1" className="text-slate">File</Text>
          <div className="flex items-center gap-2">
            <Text className="flex-auto truncate">
              { script._file ? `content/${script._file}` : 'Not saved' }
            </Text>
            <Button
              type="button"
              size="1"
              className="flex-none"
              onClick={onRenameFile}
            >
              Rename
            </Button>
            <Button
              type="button"
              size="1"
              className="flex-none"
              onClick={openParentFolder}
            >
              Open
            </Button>
          </div>
        </div>
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
    </ScrollArea>
  );
};

export default ScriptForm;
