import type { CollisionBrush } from './types';

// Butano regular backgrounds can only be 256x256, 256x512, 512x256 or 512x512.
export const BACKGROUND_TILE_SIZE = 256;
export const BACKGROUND_MAX_SINGLE_SIZE = 512;

// The GBA has 64KB of background VRAM, shared by the tiles (8bpp = 64 bytes each) and the maps (2KB
// for each 256x256 tile) of every loaded background. A screen can overlap up to 2x2 tiles.
export const BACKGROUND_VRAM_TILES_BUDGET = (64 * 1024 - 4 * 2048) / 64;

// Butano big maps (regular backgrounds bigger than 512x512) are limited to 16384px and must be a
// multiple of 256px.
export const BACKGROUND_MAX_BIG_SIZE = 16384;

export const COLLISION_EMPTY = '0';
export const COLLISION_BLOCK = '1';
export const COLLISION_SLOPE_LEFT = '2';
export const COLLISION_SLOPE_RIGHT = '3';
export const COLLISION_ONE_WAY_TOP = '4';
export const COLLISION_ONE_WAY_BOTTOM = '5';
export const COLLISION_ONE_WAY_LEFT = '6';
export const COLLISION_ONE_WAY_RIGHT = '7';
export const COLLISION_ONE_WAY_SLOPE_LEFT = '8';
export const COLLISION_ONE_WAY_SLOPE_RIGHT = '9';

export const COLLISION_BRUSH_VALUES: Record<CollisionBrush, string> = {
  none: COLLISION_EMPTY,
  normal: COLLISION_BLOCK,
  'slope-left': COLLISION_SLOPE_LEFT,
  'slope-right': COLLISION_SLOPE_RIGHT,
  'one-way-top': COLLISION_ONE_WAY_TOP,
  'one-way-bottom': COLLISION_ONE_WAY_BOTTOM,
  'one-way-left': COLLISION_ONE_WAY_LEFT,
  'one-way-right': COLLISION_ONE_WAY_RIGHT,
  'one-way-slope-left': COLLISION_ONE_WAY_SLOPE_LEFT,
  'one-way-slope-right': COLLISION_ONE_WAY_SLOPE_RIGHT,
};

export const COLLISION_COLOR = 'rgba(255, 0, 0, 0.4)';
export const COLLISION_ONE_WAY_COLOR = 'rgba(0, 255, 0, 0.4)';

export const DEFAULT_GRAVITY_FORCE = 1;
export const DEFAULT_JUMP_HEIGHT = 36;
