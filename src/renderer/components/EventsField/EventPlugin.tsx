import { useCallback, useMemo } from 'react';
import { Select, Switch as Toggle, Text, TextField } from '@radix-ui/themes';
import { set } from '@junipero/react';

import type { PluginEvent } from '../../../types';
import { getEventDefinition } from '../../services/events';
import EventValueField, { EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES } from '../EventValueField';
import BackgroundsListField from '../BackgroundsListField';
import FontsListField from '../FontsListField';
import MusicListField from '../MusicListField';
import SoundsListField from '../SoundsListField';
import SpritesListField from '../SpritesListField';
import Switch from '../Switch';

export interface EventPluginProps {
  event: PluginEvent;
  onValueChange?: (event: PluginEvent) => void;
}

const EventPlugin = ({
  event,
  onValueChange,
}: EventPluginProps) => {
  const definition = useMemo(() => (
    getEventDefinition(event.type).pluginEvent
  ), [event.type]);

  const onParamChange = useCallback((key: string, value: any) => {
    set(event, `params.${key}`, value);
    onValueChange?.(event);
  }, [onValueChange, event]);

  if (!definition) {
    return (
      <Text className="text-xs text-slate text-center block">
        This plugin event is unavailable: its plugin is missing or disabled.
      </Text>
    );
  }

  if (!definition.fields?.length) {
    return (
      <Text className="text-xs text-slate text-center block">
        This event has no properties
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      { definition.description && (
        <Text size="1" className="text-slate">{ definition.description }</Text>
      ) }
      { definition.fields.map(field => {
        const value = event.params?.[field.key] ?? field.default;

        return (
          <div key={field.key} className="flex flex-col gap-2">
            <Text size="1" className="text-slate">
              { field.label ?? field.key }
            </Text>
            <Switch value={field.type}>
              <Switch.Case value="boolean">
                <Text as="label" size="2" className="flex items-center gap-2">
                  <Toggle
                    checked={value === true || value === 'true'}
                    onCheckedChange={onParamChange.bind(null, field.key)}
                  />
                  { field.text }
                </Text>
              </Switch.Case>
              <Switch.Case value="select">
                <Select.Root
                  value={String(value ?? '')}
                  onValueChange={onParamChange.bind(null, field.key)}
                >
                  <Select.Trigger />
                  <Select.Content>
                    { field.options?.map(option => (
                      <Select.Item key={option.value} value={option.value}>
                        { option.label ?? option.value }
                      </Select.Item>
                    )) }
                  </Select.Content>
                </Select.Root>
              </Switch.Case>
              <Switch.Case value="sprite">
                <SpritesListField
                  nullable
                  value={String(value ?? '')}
                  onValueChange={onParamChange.bind(null, field.key)}
                />
              </Switch.Case>
              <Switch.Case value="background">
                <BackgroundsListField
                  value={String(value ?? '')}
                  onValueChange={onParamChange.bind(null, field.key)}
                />
              </Switch.Case>
              <Switch.Case value="font">
                <FontsListField
                  value={String(value ?? '')}
                  onValueChange={onParamChange.bind(null, field.key)}
                />
              </Switch.Case>
              <Switch.Case value="sound">
                <SoundsListField
                  value={String(value ?? '')}
                  onValueChange={onParamChange.bind(null, field.key)}
                />
              </Switch.Case>
              <Switch.Case value="music">
                <MusicListField
                  value={String(value ?? '')}
                  onValueChange={onParamChange.bind(null, field.key)}
                />
              </Switch.Case>
              <Switch.Case default>
                <EventValueField
                  type={field.type === 'number' ? 'number' : 'text'}
                  excludeTypes={EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES}
                  value={value as string | number}
                  onValueChange={onParamChange.bind(null, field.key)}
                >
                  { field.unit && (
                    <TextField.Slot side="right">{ field.unit }</TextField.Slot>
                  ) }
                </EventValueField>
              </Switch.Case>
            </Switch>
          </div>
        );
      }) }
    </div>
  );
};

export default EventPlugin;
