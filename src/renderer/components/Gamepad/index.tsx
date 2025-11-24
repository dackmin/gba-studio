import { type ComponentPropsWithoutRef, useEffect } from 'react';
import { useEventListener } from '@junipero/react';

export interface GamepadProps extends ComponentPropsWithoutRef<any> {
  axisMinThreshold?: number;
  onConnected?: (gamepads: Gamepad[]) => void;
  onDisconnected?: (gamepads: Gamepad[]) => void;
  onPress?: (button: string) => void;
  onAxis?: (axis: string, value: number) => void;
  onRelease?: (button: string) => void;
}

const BINDINGS = [
  'A',
  'B',
  'X',
  'Y',
  'L1',
  'R1',
  'L2',
  'R2',
  'Select',
  'Start',
  'L3',
  'R3',
  'Up',
  'Down',
  'Left',
  'Right',
  'Home',
];

const AXIS_BINDINGS = [
  'LeftStickX',
  'LeftStickY',
  'RightStickX',
  'RightStickY',
];

const Gamepad = ({
  children,
  axisMinThreshold = 0.1,
  onConnected,
  onDisconnected,
  onPress,
  onAxis,
  onRelease,
}: GamepadProps) => {
  useEventListener('gamepadconnected', () => {
    const gamepads = navigator.getGamepads()
      .filter(gp => gp !== null) as Gamepad[];
    onConnected?.(gamepads);
  }, []);

  useEventListener('gamepaddisconnected', () => {
    const gamepads = navigator.getGamepads()
      .filter(gp => gp !== null) as Gamepad[];
    onDisconnected?.(gamepads);
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    const pressed: string[] = [];

    const isPressed = (gamepad: Gamepad, buttonIndex: number) => {
      return pressed.includes(`${gamepad.index}-${buttonIndex}`);
    };

    const handleGamepadInput = () => {
      const gamepads = navigator.getGamepads()
        .filter(gp => gp !== null) as Gamepad[];

      gamepads.forEach(gp => {
        gp?.buttons.forEach((button, index) => {
          if (!BINDINGS[index]) {
            return;
          }

          if (button.pressed) {

            if (!isPressed(gp, index)) {
              pressed.push(`${gp.index}-${index}`);
            }

            onPress?.(BINDINGS[index]);
          } else {
            const buttonKey = `${gp.index}-${index}`;
            const pressedIndex = pressed.indexOf(buttonKey);

            if (pressedIndex !== -1) {
              pressed.splice(pressedIndex, 1);
              onRelease?.(BINDINGS[index]);
            }
          }
        });

        gp?.axes.forEach((axis, index) => {
          if (!AXIS_BINDINGS[index]) {
            return;
          }

          if (Math.abs(axis) >= axisMinThreshold) {
            if (!isPressed(gp, index + 100)) {
              pressed.push(`${gp.index}-${index + 100}`);
            }

            onAxis?.(AXIS_BINDINGS[index], axis);
          } else if (isPressed(gp, index + 100)) {
            const axisKey = `${gp.index}-${index + 100}`;
            const pressedIndex = pressed.indexOf(axisKey);

            if (pressedIndex !== -1) {
              pressed.splice(pressedIndex, 1);
              onRelease?.(AXIS_BINDINGS[index]);
            }
          }
        });
      });

      animationFrameId = requestAnimationFrame(handleGamepadInput);
    };

    if (navigator.getGamepads().length > 0) {
      handleGamepadInput();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    onPress, onRelease, onAxis,
    axisMinThreshold,
  ]);

  return children;
};

export default Gamepad;
