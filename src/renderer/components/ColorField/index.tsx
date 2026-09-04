import { type ChangeEvent, useCallback } from 'react';
import { DropdownMenu, TextField } from '@radix-ui/themes';
import { HexColorPicker } from 'react-colorful';
import { classNames } from '@junipero/react';
// import { ColorWheelIcon } from '@radix-ui/react-icons';

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

  // const onPickColor = useCallback(async () => {
  //   const color = await (new window.EyeDropper()).open();
  //   onValueChange?.(color.sRGBHex);
  // }, [onValueChange]);

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
      { /*
        There are multiple bugs in chromium related to a shift in detected colors with EyeDropper
        https://issues.chromium.org/issues/381372611
        ----
        TL;DR Chrome takes a screenshot of the page when you call EyeDropper.open() and passes the
        color from sRGB to Display Space (p3 for example) back to sRGB, which introduces rounding
        errors.
        For example, if my color is #00FF00, the color detected by EyeDropper is #01FF00.
        ----
        Using native electron libraries is not an option either as they all use the Screen
        Video Capture capability that pops-up a weird sub-desktop video capture (and need a system
        permission).
        Disabling it for now.

        <TextField.Slot side="right">
        <IconButton size="1" onClick={onPickColor}>
          <ColorWheelIcon />
        </IconButton>
      </TextField.Slot> */}
    </TextField.Root>
  );
};

export default ColorField;
