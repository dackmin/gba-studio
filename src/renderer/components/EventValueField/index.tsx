import { type ChangeEvent, useCallback, useMemo } from 'react';
import { Button, Select, Text, TextField } from '@radix-ui/themes';
import { Select as SelectPrimitive } from 'radix-ui';
import { classNames } from '@junipero/react';

import type { DynamicValue, EventValue } from '../../../types';
import Switch from '../Switch';
import { useApp } from '../../services/hooks';

export interface EventValueFieldProps
  extends Omit<TextField.RootProps, 'value' | 'defaultValue'> {
  value?: EventValue;
  defaultValue?: EventValue;
  excludeTypes?: string[];
  onValueChange?: (value: EventValue) => void;
}

const EventValueField = ({
  type,
  value,
  defaultValue,
  children,
  className,
  excludeTypes = ['saved-game'],
  min = 0,
  onValueChange,
  ...rest
}: EventValueFieldProps) => {
  const { variables } = useApp();
  const val = value ?? defaultValue ?? '';
  const isDynamicValue = useMemo(() => (
    typeof val === 'object'
  ), [val]);

  const allVariables = useMemo(() => (
    variables.flatMap(v => v.values)
  ), [variables]);

  const onTypeChange = useCallback((type: string) => {
    const currentType = !isDynamicValue
      ? 'value' : (val as DynamicValue).type;

    if (type === currentType) {
      return;
    }

    if (type === 'value') {
      onValueChange?.('');
    } else if (type === 'variable') {
      onValueChange?.({
        type,
        name: allVariables[0]?.id || allVariables[0]?.name || '',
      });
    } else {
      onValueChange?.({ type } as DynamicValue);
    }
  }, [onValueChange, isDynamicValue, val, allVariables]);

  const onTextChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (isDynamicValue) {
      onValueChange?.({
        ...(val as DynamicValue),
        name: e.target.value,
      });
    } else if (type === 'number') {
      onValueChange?.(Math.max(Number(min), Number(e.target.value || min)));
    } else {
      onValueChange?.(e.target.value);
    }
  }, [onValueChange, isDynamicValue, val, type, min]);

  const onValueChange_ = useCallback((name: string) => {
    if (isDynamicValue) {
      onValueChange?.({
        ...(val as DynamicValue),
        name,
      });
    }
  }, [onValueChange, isDynamicValue, val]);

  const getVariableById = useCallback((id?: string) => {
    return allVariables.find(v => v.id === id || v.name === id);
  }, [allVariables]);

  return (
    <TextField.Root
      { ...rest }
      type={isDynamicValue ? 'text' : type}
      value={isDynamicValue
        ? (val as DynamicValue).name || '' : (val as string | number)}
      className={classNames(
        className,
        {
          '[&>input]:!hidden overflow-hidden': isDynamicValue &&
            ['variable', 'saved-game'].includes((val as DynamicValue).type),
        }
      )}
      onChange={onTextChange}
    >
      <TextField.Slot side="left" className="!mx-[2px]">
        <Select.Root
          value={!isDynamicValue ? 'value' : (val as DynamicValue).type}
          onValueChange={onTypeChange}
        >
          <SelectPrimitive.Trigger asChild>
            <Button variant="ghost" size="1" className="px-1.5!">
              <SelectPrimitive.Value>
                <Text size="1" className="font-bold dark:text-seashell">
                  <Switch
                    value={!isDynamicValue
                      ? 'value' : (val as DynamicValue).type}
                  >
                    <Switch.Case value="variable">$</Switch.Case>
                    <Switch.Case value="saved-game">↓</Switch.Case>
                    <Switch.Case default>#</Switch.Case>
                  </Switch>
                </Text>
              </SelectPrimitive.Value>
            </Button>
          </SelectPrimitive.Trigger>
          <Select.Content>
            <Select.Item value="value">
              <Text className="text-slate">#</Text> Value
            </Select.Item>
            <Select.Item value="variable">
              <Text className="text-slate">$</Text> Variable
            </Select.Item>
            { !excludeTypes.includes('saved-game') && (
              <Select.Item value="saved-game">
                <Text className="text-slate">↓</Text> Has Saved Game
              </Select.Item>
            ) }
          </Select.Content>
        </Select.Root>
      </TextField.Slot>
      { isDynamicValue && (val as DynamicValue).type === 'variable' && (
        <TextField.Slot side="left">
          <Select.Root
            value={(val as DynamicValue).name}
            onValueChange={onValueChange_}
          >
            <SelectPrimitive.Trigger asChild>
              <Button variant="ghost" size="1">
                <SelectPrimitive.Value>
                  <Text size="1" className="dark:text-seashell">
                    {
                      getVariableById((val as DynamicValue).name)?.name ||
                      'Select Variable'
                    }
                  </Text>
                </SelectPrimitive.Value>
              </Button>
            </SelectPrimitive.Trigger>
            <Select.Content>
              { allVariables.map(v => (
                <Select.Item key={v.id} value={v.id || v.name}>
                  <Text>{ v.name }</Text>
                </Select.Item>
              )) }
            </Select.Content>
          </Select.Root>
        </TextField.Slot>
      ) }
      { isDynamicValue && (val as DynamicValue).type === 'saved-game' && (
        <TextField.Slot side="left">
          <Text size="1" className="dark:text-seashell">
            Has Saved Game
          </Text>
        </TextField.Slot>
      ) }
      { !isDynamicValue && children }
    </TextField.Root>
  );
};

export default EventValueField;
