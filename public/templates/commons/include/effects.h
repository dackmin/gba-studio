#ifndef NEO_EFFECTS_H
#define NEO_EFFECTS_H

#include <bn_fixed.h>
#include <bn_regular_bg_position_hbe_ptr.h>

#include <neo_types.h>

namespace neo
{
  class game;
}

namespace neo::effects
{
  // ---- Palette effects (set-palette-effect) ----

  // Reads the current value of a palette effect, in percent (0-100),
  // like the Butano getters do.
  bn::fixed get_palette_effect(bn::string_view target, bn::string_view effect);

  // Applies a palette effect to the background and/or sprite palettes.
  // Value is in percent (0-100).
  void set_palette_effect(bn::string_view target, bn::string_view effect, bn::fixed value);

  // ---- Wave effect (wave-effect) ----

  // Starts (or restarts) a per-scanline horizontal wave distortion of the
  // scene background and/or actors/sprites, ticked once per frame by
  // update_wave_effect() while enabled. duration_frames = 0 runs until the
  // scene changes. No-op when there is no scene background.
  void start_wave_effect(
    neo::game* game,
    bn::string_view target, bn::fixed amplitude, bn::fixed speed, int frequency, int duration_frames,
    bn::string_view envelope
  );

  // Advances the wave by one frame, including the per-scanline background
  // deltas and the faked per-sprite offsets. No-op while disabled.
  void update_wave_effect(neo::game* game);

  // Stops the wave, releasing the H-Blank effect and undoing the offsets
  // baked into every rendered sprite (see effects.cpp).
  void stop_wave_effect(neo::game* game);

  // Whether a wave is currently running (used by the parallel-events
  // wave-effect handler to report back once the countdown stopped it).
  bool is_wave_enabled();
}

#endif
