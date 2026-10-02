import { useCallback, useMemo } from 'react';
import { set } from '@junipero/react';
import { Select, Text } from '@radix-ui/themes';

import type { EventValue, ExecuteScriptEvent } from '../../../types';
import { useApp } from '../../services/hooks';
import EventValueField from '../EventValueField';
import VariablesListField from '../VariablesListField';
import ActorListField from '../ActorListField';

export interface EventScriptProps {
  event: ExecuteScriptEvent;
  onValueChange?: (
    event: ExecuteScriptEvent,
  ) => void;
}

const EventScript = ({
  event,
  onValueChange,
}: EventScriptProps) => {
  const { scripts, variables } = useApp();
  const script = scripts.find(item => item.id === event.script || item._file === event.script);

  const onScriptChange = useCallback((id: string) => {
    const selected = scripts.find(item => item.id === id);
    const parameters: EventValue[] = selected?.parameters?.map((parameter): EventValue => (
      parameter.type === 'variable'
        ? { type: 'variable', name: variables.flatMap(registry => registry.values)[0]?.id || '' }
        : parameter.type === 'actor'
          ? { type: 'actor', name: '' }
          : ''
    )) ?? [];
    set(event, 'script', id);
    set(event, 'parameters', parameters);
    onValueChange?.(event);
  }, [event, onValueChange, scripts, variables]);

  const parameterValues = useMemo<EventValue[]>(() => (
    script?.parameters?.map((parameter, index): EventValue => {
      const current = event.parameters?.[index];

      if (parameter.type === 'variable') {
        return typeof current === 'object' && current?.type === 'variable'
          ? current
          : {
            type: 'variable',
            name: variables.flatMap(registry => registry.values)[0]?.id || '',
          };
      }

      if (parameter.type === 'actor') {
        return typeof current === 'object' && current?.type === 'actor'
          ? current
          : { type: 'actor', name: '' };
      }

      return typeof current === 'object' ? '' : current ?? '';
    }) ?? []
  ), [script?.parameters, event.parameters, variables]);

  const onParameterChange = useCallback((index: number, value: EventValue) => {
    const parameters = [...parameterValues];
    parameters[index] = value;
    set(event, 'parameters', parameters);
    onValueChange?.(event);
  }, [event, onValueChange, parameterValues]);

  return (
    <div className="flex flex-col gap-2">
      <Text size="1" className="text-slate">Script</Text>
      <Select.Root
        value={event.script || ''}
        onValueChange={onScriptChange}
      >
        <Select.Trigger placeholder="Select" />
        <Select.Content>
          { scripts.map(script => (
            <Select.Item key={script.id} value={script.id}>
              { script.name }
            </Select.Item>
          )) }
        </Select.Content>
      </Select.Root>
      { script?.parameters?.map((parameter, index) => (
        <div key={parameter.id} className="flex flex-col gap-2">
          <Text size="1" className="text-slate">{ parameter.name }</Text>
          { parameter.type === 'variable' ? (
            <VariablesListField
              value={(parameterValues[index] as { name?: string })?.name || ''}
              onValueChange={name => onParameterChange(index, { type: 'variable', name })}
            />
          ) : parameter.type === 'actor' ? (
            <ActorListField
              value={(parameterValues[index] as { name?: string })?.name || ''}
              onValueChange={name => onParameterChange(index, { type: 'actor', name })}
            />
          ) : (
            <EventValueField
              type="text"
              excludeTypes={[
                'variable', 'saved-game', 'player-attribute', 'direction', 'collision-side',
                'scene',
              ]}
              value={parameterValues[index] ?? ''}
              onValueChange={value => onParameterChange(index, value)}
            />
          )}
        </div>
      )) }
    </div>
  );
};

export default EventScript;
