import { type ComponentPropsWithoutRef, useState } from 'react';
import { classNames, useEventListener } from '@junipero/react';
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  GearIcon,
  KeyboardIcon,
  MixIcon,
} from '@radix-ui/react-icons';
import { Kbd, Slider, Text } from '@radix-ui/themes';

import { useEmulator } from '../../services/hooks';

export interface LeftSidebarProps extends ComponentPropsWithoutRef<'div'> {}

const LeftSidebar = ({
  className,
}: LeftSidebarProps) => {
  const [gamepadConnected, setGamepadConnected] = useState(() => {
    return navigator.getGamepads().some(gp => gp !== null);
  });
  const { volume, setVolume } = useEmulator();

  useEventListener('gamepadconnected', () => {
    setGamepadConnected(true);
  }, []);

  useEventListener('gamepaddisconnected', () => {
    setGamepadConnected(false);
  }, []);

  const onVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  return (
    <div className={classNames('flex flex-col !w-full gap-px', className)}>
      <div className="flex flex-col gap-2 mt-4 px-4">
        <div className="flex items-center gap-2 justify-center py-2">
          <GearIcon />
          <Text size="1" className="text-slate">Settings</Text>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex-none">
            Volume
          </div>
          <div className="flex-auto">
            <Slider min={0} max={200} value={[volume * 100]} onValueChange={onVolumeChange} />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-4 px-4">
        <div className="flex items-center gap-2 justify-center py-2">
          <KeyboardIcon />
          <Text size="1" className="text-slate">Keyboard bindings</Text>
        </div>
        <div className="flex items-center gap-2">
          <Kbd size="3"><ArrowUpIcon /></Kbd>
          <Text size="2">Move up</Text>
        </div>
        <div className="flex items-center gap-2">
          <Kbd size="3"><ArrowRightIcon /></Kbd>
          <Text size="2">Move right</Text>
        </div>
        <div className="flex items-center gap-2">
          <Kbd size="3"><ArrowDownIcon /></Kbd>
          <Text size="2">Move down</Text>
        </div>
        <div className="flex items-center gap-2">
          <Kbd size="3"><ArrowLeftIcon /></Kbd>
          <Text size="2">Move left</Text>
        </div>
        <div className="flex items-center gap-2">
          <Kbd size="3">A</Kbd>
          <Text size="2">Button A</Text>
        </div>
        <div className="flex items-center gap-2">
          <Kbd size="3">Z</Kbd>
          <Text size="2">Button B</Text>
        </div>
        <div className="flex items-center gap-2">
          <Kbd size="3">Q</Kbd>
          <Text size="2">Button L</Text>
        </div>
        <div className="flex items-center gap-2">
          <Kbd size="3">S</Kbd>
          <Text size="2">Button R</Text>
        </div>
        <div className="flex items-center gap-2">
          <Kbd size="3">Enter</Kbd>
          <Text size="2">Start</Text>
        </div>
        <div className="flex items-center gap-2">
          <Kbd size="3">Backspace</Kbd>
          <Text size="2">Select</Text>
        </div>
        <div className="flex items-center gap-2">
          <Kbd size="3">Space</Kbd>
          <Text size="2">Speed-up CPU (hold)</Text>
        </div>
        <div className="flex items-center gap-2">
          <Kbd size="3">R</Kbd>
          <Text size="2">Reset game</Text>
        </div>
      </div>
      { gamepadConnected && (
        <div className="flex flex-col gap-2 mt-4 px-2">
          <div className="flex items-center gap-2 justify-center py-2">
            <MixIcon />
            <Text size="1" className="text-slate">Gamepad bindings</Text>
          </div>
        </div>
      ) }
    </div>
  );
};

export default LeftSidebar;
