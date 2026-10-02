import { type ChangeEvent, type KeyboardEvent, useCallback } from 'react';
import {
  Button,
  Heading,
  IconButton,
  Inset,
  ScrollArea,
  Select,
  Separator,
  Text,
  TextField,
} from '@radix-ui/themes';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { classNames, set } from '@junipero/react';
import { v4 as uuid } from 'uuid';

import type { GameScript } from '../../../types';
import { useApp } from '../../services/hooks';
import EventsField from '../../components/EventsField';
import { type ScriptFormContextType, ScriptFormContext } from '../../services/contexts';

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

  const onAddParameter = useCallback(() => {
    const parameters = [...(script.parameters ?? []), {
      id: uuid(),
      name: `parameter${(script.parameters?.length ?? 0) + 1}`,
      type: 'value' as const,
    }];
    onValueChange('parameters', parameters);
  }, [onValueChange, script.parameters]);

  const onParameterChange = useCallback((index: number, name: string, value: string) => {
    const parameters = [...(script.parameters ?? [])];
    parameters[index] = { ...parameters[index], [name]: value };
    onValueChange('parameters', parameters);
  }, [onValueChange, script.parameters]);

  const onParameterDelete = useCallback((index: number) => {
    onValueChange('parameters', (script.parameters ?? []).filter((_, i) => i !== index));
  }, [onValueChange, script.parameters]);

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

  const getContext = useCallback((): ScriptFormContextType => ({
    script,
  }), [script]);

  return (
    <ScriptFormContext value={getContext()}>
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
          <div className="flex flex-col gap-2">
            <Text size="1" className="text-slate">Parameters</Text>
            { (script.parameters ?? []).map((parameter, index) => (
              <div key={parameter.id} className="flex items-center gap-2">
                <TextField.Root
                  className="flex-auto"
                  value={parameter.name}
                  onChange={e => onParameterChange(index, 'name', e.target.value)}
                />
                <Select.Root
                  value={parameter.type}
                  onValueChange={value => onParameterChange(index, 'type', value)}
                >
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value="value">Value</Select.Item>
                    <Select.Item value="variable">Variable</Select.Item>
                    <Select.Item value="actor">Actor</Select.Item>
                  </Select.Content>
                </Select.Root>
                <IconButton
                  type="button"
                  variant="ghost"
                  color="red"
                  aria-label="Remove parameter"
                  onClick={() => onParameterDelete(index)}
                >
                  <TrashIcon />
                </IconButton>
              </div>
            )) }
            <Button
              type="button"
              variant="soft"
              disabled={(script.parameters?.length ?? 0) >= 10}
              onClick={onAddParameter}
            >
              <PlusIcon />
              Add Parameter
            </Button>
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
    </ScriptFormContext>
  );
};

export default ScriptForm;
