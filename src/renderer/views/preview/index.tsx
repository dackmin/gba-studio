import { useCallback, useEffect, useRef, useState } from 'react';
import { classNames, useEventListener } from '@junipero/react';
import mGBA, { type mGBAEmulator } from '@thenick775/mgba-wasm';

import { useApp } from '../../services/hooks';
import ConstrainedView from '../../windows/editor/ConstrainedView';
import Gamepad from '../../components/Gamepad';

const Preview = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [emulator, setEmulator] = useState<mGBAEmulator | null>(null);
  const { projectPath } = useApp();
  const scale = 3;

  useEventListener('keydown', event => {
    if (event.key === ' ') {
      event.preventDefault();
      emulator?.setFastForwardMultiplier(4);
    }
  }, [emulator]);

  const reload = useCallback((module: mGBAEmulator) => {
    // eslint-disable-next-line new-cap
    module.FSSync();
    module.loadGame('/data/games/game.gba');

    module.bindKey('a', 'a');
    module.bindKey('z', 'b');
    module.bindKey('q', 'l');
    module.bindKey('s', 'r');
    module.bindKey('enter', 'start');
    module.bindKey('backspace', 'select');
    module.bindKey('up', 'up');
    module.bindKey('down', 'down');
    module.bindKey('left', 'left');
    module.bindKey('right', 'right');
  }, []);

  useEventListener('keyup', event => {
    if (event.key === ' ') {
      event.preventDefault();
      emulator?.setFastForwardMultiplier(1);
    } else if (event.key === 'r' && emulator) {
      emulator.quitGame();
      reload(emulator);
    }
  }, [emulator]);

  const init = useCallback(async () => {
    if (!canvasRef.current) {
      return;
    }

    const module = await mGBA({ canvas: canvasRef.current });
    // eslint-disable-next-line new-cap
    await module.FSInit();
    module.setCoreSettings({
      autoSaveStateEnable: false,
      restoreAutoSaveStateOnLoad: false,
    });

    const romPath = await window.electron.getRomPath(projectPath);
    const file = await fetch(`project://${romPath}`);
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    await new Promise(resolve => {
      module.uploadRom(new File([uint8Array], 'game.gba'), () => {
        reload(module);
        resolve(true);
      });
    });

    setEmulator(module);

    return module;
  }, [projectPath, reload]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    return () => {
      emulator?.quitGame();
    };
  }, [emulator]);

  const onGamepadButtonPress = useCallback((button: string) => {
    switch (button) {
      case 'L2':
      case 'R2':
        emulator?.setFastForwardMultiplier(4);
        break;
      default:
        emulator?.buttonPress(button.toLowerCase());
    }
  }, [emulator]);

  const onGamepadButtonRelease = useCallback((button: string) => {
    switch (button) {
      case 'LeftStickX':
        emulator?.buttonUnpress('left');
        emulator?.buttonUnpress('right');
        break;
      case 'LeftStickY':
        emulator?.buttonUnpress('up');
        emulator?.buttonUnpress('down');
        break;
      case 'L2':
      case 'R2':
        emulator?.setFastForwardMultiplier(1);
        break;
      default:
        emulator?.buttonUnpress(button.toLowerCase());
    }
  }, [emulator]);

  const onGamepadAxis = useCallback((axis: string, value: number) => {
    switch (axis) {
      case 'LeftStickX':
        if (value < -0.5) {
          emulator?.buttonPress('left');
        } else if (value > 0.5) {
          emulator?.buttonPress('right');
        } else {
          emulator?.buttonUnpress('left');
          emulator?.buttonUnpress('right');
        }

        break;
      case 'LeftStickY':
        if (value < -0.5) {
          emulator?.buttonPress('up');
        } else if (value > 0.5) {
          emulator?.buttonPress('down');
        } else {
          emulator?.buttonUnpress('up');
          emulator?.buttonUnpress('down');
        }

        break;
    }
  }, [emulator]);

  return (
    <ConstrainedView>
      <Gamepad
        onPress={onGamepadButtonPress}
        onRelease={onGamepadButtonRelease}
        onAxis={onGamepadAxis}
      >
        <div
          className={classNames(
            'min-h-full w-full flex-auto flex items-center justify-center',
          )}
        >
          <canvas
            ref={canvasRef}
            className="bg-black rounded-lg pixelated"
            style={{ width: 240 * scale, height: 160 * scale }}
            onClick={() => emulator ? emulator.resumeGame() : init()}
          />
        </div>
      </Gamepad>
    </ConstrainedView>
  );
};

export default Preview;

export { default as LeftSidebar } from './LeftSidebar';
