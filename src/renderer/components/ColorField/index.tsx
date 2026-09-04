import { type ChangeEvent, useCallback } from 'react';
import { DropdownMenu, IconButton, TextField } from '@radix-ui/themes';
import { HexColorPicker } from 'react-colorful';
import { classNames } from '@junipero/react';
import { ColorWheelIcon } from '@radix-ui/react-icons';

export interface ColorField extends TextField.RootProps {
  onValueChange?: (value: string) => void;
}

const ColorField = ({
  defaultValue,
  value,
  disabled,
  onChange,
  onValueChange,
  ...props
}: ColorField) => {
  const val = value ?? defaultValue ?? '';

  const onChange_ = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(e.target.value);
    onChange?.(e);
  }, [onChange, onValueChange]);

  const onPickColor = useCallback(async () => {
    const color = await (new window.EyeDropper()).open();
    onValueChange?.(color.sRGBHex);
  }, [onValueChange]);

  return (
    <TextField.Root
      { ...props }
      defaultValue={defaultValue}
      value={value}
      disabled={disabled}
      onChange={onChange_}
    >
      <TextField.Slot side="left">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger disabled={disabled}>
            <div
              style={{ backgroundColor: '' + val }}
              className="rounded-sm border-1 border-(--gray-5) w-4 h-4 cursor-pointer"
            />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content side="top">
            <HexColorPicker
              color={'' + (val || '')}
              onChange={onValueChange}
              className={classNames(
                'color-sat-pointer:w-3! color-sat-pointer:h-3!',
                'color-hue-pointer:w-3! color-hue-pointer:rounded-[3px]!',
              )}
            />
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </TextField.Slot>
      <TextField.Slot side="right">
        <IconButton size="1" onClick={onPickColor}>
          <ColorWheelIcon />
        </IconButton>
      </TextField.Slot>
    </TextField.Root>
  );
};

export default ColorField;
