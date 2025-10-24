import { useCallback, useEffect, useRef, useState } from 'react';
import { classNames } from '@junipero/react';
import mGBA, { type mGBAEmulator } from '@thenick775/mgba-wasm';

import { useApp } from '../../services/hooks';
import ConstrainedView from '../../windows/editor/ConstrainedView';

const Preview = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [_emulator, setEmulator] = useState<mGBAEmulator | null>(null);
  const { projectPath } = useApp();
  const scale = 2;

  const init = useCallback(async () => {
    if (!canvasRef.current) {
      return;
    }

    const module = await mGBA({ canvas: canvasRef.current });
    // eslint-disable-next-line new-cap
    await module.FSInit();
    await module.loadGame(await window.electron.getRomPath(projectPath));
    setEmulator(module);
  }, [projectPath]);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <ConstrainedView
      className={classNames(
        'flex items-center justify-center',
      )}
    >
      <canvas
        ref={canvasRef}
        className="bg-black rounded-lg"
        style={{ width: 240 * scale, height: 160 * scale }}
      />
    </ConstrainedView>
  );
};

export default Preview;
