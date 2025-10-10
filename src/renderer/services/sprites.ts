import { FramesDefinition } from '../../types';

export const HORIZONTAL_FRAMES: FramesDefinition = {
  idle: {
    down: 0,
    up: 1,
    right: 2,
    left: 2,
  },
  walk: {
    down: [4, 5],
    up: [6, 7],
    left: [8, 9],
    right: [8, 9],
  },
};
