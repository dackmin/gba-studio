import { type ChangeEvent, useCallback, useMemo } from 'react';
import { Button, Select, Text, TextField } from '@radix-ui/themes';
import { Select as SelectPrimitive } from 'radix-ui';

import type { DynamicValue, EventValue } from '../../../types';
import Switch from '../Switch';

export interface EventValueFieldProps
  extends Omit<TextField.RootProps, 'value' | 'defaultValue'> {
  value: EventValue;
  defaultValue?: EventValue;
  onValueChange?: (value: EventValue) => void;
}

const EventValueField = ({
  type,
  value,
  defaultValue,
  children,
  onValueChange,
  ...rest
}: EventValueFieldProps) => {
  const val = value ?? defaultValue ?? '';
  const isDynamicValue = useMemo(() => (
    typeof val === 'object'
  ), [val]);

  const onTypeChange = useCallback((type: 'value' & DynamicValue['type']) => {
    if (!isDynamicValue && type !== 'value') {
      onValueChange?.({ type });
    } else if (isDynamicValue && type === 'value') {
      onValueChange?.('');
    }
  }, [onValueChange, isDynamicValue, val]);

  const onTextChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (isDynamicValue) {
      onValueChange?.({
        ...(val as DynamicValue),
        name: e.target.value,
      });
    } else if (type === 'number') {
      onValueChange?.(Math.max(0, Number(e.target.value) || 0));
    } else {
      onValueChange?.(e.target.value);
    }
  }, [onValueChange, isDynamicValue, val, type]);

  return (
    <TextField.Root
      { ...rest }
      type={isDynamicValue ? 'text' : type}
      value={isDynamicValue
        ? (val as DynamicValue).name || '' : (val as string | number)}
      onChange={onTextChange}
    >
      <TextField.Slot side="left" className="!mx-[2px]">
        <Select.Root
          value={!isDynamicValue ? 'value' : (val as DynamicValue).type}
          onValueChange={onTypeChange}
        >
          <SelectPrimitive.Trigger asChild>
            <Button variant="ghost" size="1">
              <SelectPrimitive.Value>
                <Text size="1" className="font-bold dark:text-seashell">
                  <Switch
                    value={!isDynamicValue
                      ? 'value' : (val as DynamicValue).type}
                  >
                    <Switch.Case value="variable">$</Switch.Case>
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
          </Select.Content>
        </Select.Root>
      </TextField.Slot>
      { !isDynamicValue && children }
    </TextField.Root>
  );
};

export default EventValueField;
