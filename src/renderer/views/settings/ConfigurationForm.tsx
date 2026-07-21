import type { ChangeEvent } from 'react';
import { Card, Heading, Select, Text, TextField } from '@radix-ui/themes';

import type { ProjectSettings } from '../../../types';

export interface ConfigurationFormProps {
  default?: boolean;
  name?: string;
  settings: ProjectSettings;
  onTextChange: (name: string, e: ChangeEvent<HTMLInputElement>) => void;
  onValueChange: (name: string, value: string) => void;
  onFieldBlur: () => void;
}

const ConfigurationForm = ({
  settings,
  name,
  default: isDefault,
  onTextChange,
  onValueChange,
  onFieldBlur,
}: ConfigurationFormProps) => {
  return (
    <Card className="!flex flex-col gap-6">
      { !isDefault && (
        <div className="flex flex-col gap-2">
          <Text>Configuration name</Text>
          <TextField.Root
            size="3"
            value={name || ''}
            onChange={onTextChange.bind(null, 'name')}
            placeholder="Unnamed"
            className="w-96"
            onBlur={onFieldBlur}
          />
        </div>
      ) }
      <div className="flex flex-col gap-3">
        <Heading size="3">Build settings</Heading>
        <Card className="!flex flex-col gap-4">
          <div className="flex flex-col items-start gap-2">
            <Text>Python executable path</Text>
            <TextField.Root
              size="3"
              value={settings?.pythonPath || ''}
              onChange={onTextChange.bind(null, 'settings.pythonPath')}
              placeholder="/usr/bin/python"
              className="w-96"
              onBlur={onFieldBlur}
            />
          </div>
          <div className="flex flex-col items-start gap-2">
            <Text>devkitPro root path</Text>
            <TextField.Root
              size="3"
              value={settings?.devkitProPath || ''}
              onChange={onTextChange.bind(null, 'settings.devkitProPath')}
              placeholder="/opt/devkitPro"
              className="w-96"
              onBlur={onFieldBlur}
            />
          </div>
        </Card>
      </div>
      <div className="flex flex-col gap-3">
        <Heading size="3">Emulator settings</Heading>
        <Card className="!flex flex-col gap-4">
          <div className="flex flex-col items-start gap-2">
            <Text>Emulator</Text>
            <Select.Root
              size="3"
              value={settings?.emulatorType || 'internal'}
              onValueChange={onValueChange.bind(null, 'settings.emulatorType')}
            >
              <Select.Trigger className="w-96" />
              <Select.Content>
                <Select.Item value="internal">Internal preview</Select.Item>
                <Select.Item value="external">External</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>

          { settings?.emulatorType === 'external' && (
            <div className="flex flex-col items-start gap-2">
              <Text>Emulator command</Text>
              <TextField.Root
                size="3"
                value={settings?.emulatorCommand || ''}
                onChange={onTextChange.bind(null, 'settings.emulatorCommand')}
                placeholder="open -a /Applications/mGBA.app"
                className="w-96"
                onBlur={onFieldBlur}
              />
            </div>
          ) }
        </Card>
      </div>
    </Card>
  );
};

export default ConfigurationForm;
