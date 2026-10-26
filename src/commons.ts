// Butano regular backgrounds can only be 256x256, 256x512, 512x256 or 512x512.
export const BACKGROUND_TILE_SIZE = 256;
export const BACKGROUND_MAX_SINGLE_SIZE = 512;

// The GBA has 64KB of background VRAM, shared by the tiles (8bpp = 64 bytes each) and the maps (2KB
// for each 256x256 tile) of every loaded background. A screen can overlap up to 2x2 tiles.
export const BACKGROUND_VRAM_TILES_BUDGET = (64 * 1024 - 4 * 2048) / 64;

// Butano big maps (regular backgrounds bigger than 512x512) are limited to 16384px and must be a
// multiple of 256px.
export const BACKGROUND_MAX_BIG_SIZE = 16384;
