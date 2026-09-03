import type { FramesDefinition } from '../../types';

export const SPRITE_HORIZONTAL_FRAMES: FramesDefinition = {
  idle: {
    down: [{ index: 0 }],
    up: [{ index: 1 }],
    right: [{ index: 2 }],
    left: [{ index: 2, reverse: true }],
  },
  moving: {
    down: [
      { index: 0 }, { index: 4 }, { index: 0 }, { index: 5 },
    ],
    up: [
      { index: 1 }, { index: 6 }, { index: 1 }, { index: 7 },
    ],
    left: [
      { index: 2, reverse: true },
      { index: 8, reverse: true },
      { index: 2, reverse: true },
      { index: 9, reverse: true },
    ],
    right: [
      { index: 2 }, { index: 8 }, { index: 2 }, { index: 9 },
    ],
  },
};

export const AUTO_FRAMES_TEMPLATES: Record<string, FramesDefinition> = {
  '160x16 16x16 movement': SPRITE_HORIZONTAL_FRAMES,
};
