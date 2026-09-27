#include <neo_logs.h>

#include <bn_core.h>
#include <bn_log.h>
#include <bn_math.h>
#include <bn_fixed.h>
#include <bn_span.h>
#include <bn_regular_bg_ptr.h>
#include <bn_regular_bg_position_hbe_ptr.h>
#include <bn_bg_palettes.h>
#include <bn_sprite_palettes.h>

#include <neo_types.h>

#include "game.h"
#include "actor.h"
#include "sprite.h"
#include "effects.h"

namespace neo::effects
{
  namespace
  {
    // Wave state, private to this module (scene resets go through
    // stop_wave_effect(), called by the scene lifecycle).
    bool wave_enabled = false;
    bn::string_view wave_target = "both"; // "background" | "sprite" | "both"
    bn::string_view wave_envelope = "in"; // "in" (0%->100%) | "in-out" (0%->100%->0%)
    bn::fixed wave_amplitude = 0;
    bn::fixed wave_current_amplitude = 0; // envelope-scaled, actually rendered
    bn::fixed wave_speed = 0;
    int wave_frequency = 1;
    bn::fixed wave_phase = 0;
    // Frames left before the wave stops on its own (-1 = no limit).
    int wave_frames_remaining = -1;
    // Total frames requested at start (0 = no limit), used by the envelope.
    int wave_total_frames = 0;
    int wave_elapsed_frames = 0;
    bn::fixed wave_deltas[160] = {};
    bn::optional<bn::regular_bg_position_hbe_ptr> wave_hbe;

    void update_wave_deltas()
    {
      for (int line = 0; line < 160; ++line)
      {
        bn::fixed angle = wave_phase + bn::fixed(line * wave_frequency * 360) / 160;

        while (angle >= 360)
        {
          angle -= 360;
        }

        while (angle < 0)
        {
          angle += 360;
        }

        wave_deltas[line] = bn::degrees_lut_sin(angle) * wave_current_amplitude;
      }
    }

    bn::fixed wave_offset_for_y(bn::fixed y)
    {
      bn::fixed line = y + (neo::types::SCREEN_HEIGHT / 2);
      bn::fixed angle = wave_phase + (line * wave_frequency * 360) / neo::types::SCREEN_HEIGHT;

      while (angle >= 360)
      {
        angle -= 360;
      }

      while (angle < 0)
      {
        angle += 360;
      }

      return bn::degrees_lut_sin(angle) * wave_current_amplitude;
    }

    bn::fixed wave_envelope_scale()
    {
      // Ramp length, in frames (~0.5s at 60 FPS).
      constexpr int max_ramp_frames = 30;

      if (wave_total_frames <= 0)
      {
        // No known end.
        if (wave_envelope == "out")
        {
          // Ramp out once, then stay at 0 (a one-shot decaying pulse).
          if (wave_elapsed_frames >= max_ramp_frames)
          {
            return 0;
          }

          return bn::fixed(1) - bn::fixed(wave_elapsed_frames) / max_ramp_frames;
        }

        // "in" / "in-out" ("in-out" is meaningless without an end): ramp in, then hold.
        if (wave_elapsed_frames >= max_ramp_frames)
        {
          return 1;
        }

        return bn::fixed(wave_elapsed_frames) / max_ramp_frames;
      }

      int ramp_frames = bn::min(max_ramp_frames, wave_total_frames / 2);

      if (ramp_frames <= 0)
      {
        return 1;
      }

      if (wave_envelope == "out")
      {
        if (wave_elapsed_frames < ramp_frames)
        {
          return bn::fixed(1) - bn::fixed(wave_elapsed_frames) / ramp_frames;
        }

        return 0;
      }

      if (wave_elapsed_frames < ramp_frames)
      {
        return bn::fixed(wave_elapsed_frames) / ramp_frames;
      }

      if (wave_envelope != "in-out")
      {
        return 1;
      }

      int frames_left = wave_total_frames - wave_elapsed_frames;

      if (frames_left < ramp_frames)
      {
        return bn::max(bn::fixed(0), bn::fixed(frames_left) / ramp_frames);
      }

      return 1;
    }
  }

  bn::fixed get_palette_effect(bn::string_view target, bn::string_view effect)
  {
    bool use_sprite = target == "sprite";

    if (effect == "brightness")
    {
      return use_sprite ? bn::sprite_palettes::brightness() : bn::bg_palettes::brightness();
    }

    if (effect == "contrast")
    {
      return use_sprite ? bn::sprite_palettes::contrast() : bn::bg_palettes::contrast();
    }

    if (effect == "intensity")
    {
      return use_sprite ? bn::sprite_palettes::intensity() : bn::bg_palettes::intensity();
    }

    if (effect == "grayscale")
    {
      return use_sprite ?
        bn::sprite_palettes::grayscale_intensity() : bn::bg_palettes::grayscale_intensity();
    }

    if (effect == "hue-shift")
    {
      return use_sprite ?
        bn::sprite_palettes::hue_shift_intensity() : bn::bg_palettes::hue_shift_intensity();
    }

    return 0;
  }

  void set_palette_effect(bn::string_view target, bn::string_view effect, bn::fixed value)
  {
    bool bg = target == "background" || target == "both";
    bool sprite = target == "sprite" || target == "both";

    if (effect == "brightness")
    {
      if (bg) bn::bg_palettes::set_brightness(value);
      if (sprite) bn::sprite_palettes::set_brightness(value);
    }
    else if (effect == "contrast")
    {
      if (bg) bn::bg_palettes::set_contrast(value);
      if (sprite) bn::sprite_palettes::set_contrast(value);
    }
    else if (effect == "intensity")
    {
      if (bg) bn::bg_palettes::set_intensity(value);
      if (sprite) bn::sprite_palettes::set_intensity(value);
    }
    else if (effect == "grayscale")
    {
      if (bg) bn::bg_palettes::set_grayscale_intensity(value);
      if (sprite) bn::sprite_palettes::set_grayscale_intensity(value);
    }
    else if (effect == "hue-shift")
    {
      if (bg) bn::bg_palettes::set_hue_shift_intensity(value);
      if (sprite) bn::sprite_palettes::set_hue_shift_intensity(value);
    }
  }

  void start_wave_effect(
    neo::game* game,
    bn::string_view target, bn::fixed amplitude, bn::fixed speed, int frequency, int duration_frames,
    bn::string_view envelope)
  {
    if (!game->scene_bg.has_value())
    {
      return;
    }

    wave_target = target;
    wave_envelope = envelope;
    wave_amplitude = amplitude;
    wave_current_amplitude = 0;
    wave_speed = speed;
    wave_frequency = frequency > 0 ? frequency : 1;
    wave_total_frames = duration_frames > 0 ? duration_frames : 0;
    wave_frames_remaining = duration_frames > 0 ? duration_frames : -1;
    wave_elapsed_frames = 0;
    wave_enabled = true;

    bool wants_bg = target == "background" || target == "both";

    if (!wants_bg)
    {
      wave_hbe.reset();
    }
    else if (!wave_hbe.has_value())
    {
      wave_phase = 0;
      update_wave_deltas();
      wave_hbe = bn::regular_bg_position_hbe_ptr::create_horizontal_optional(
        *game->scene_bg, bn::span<const bn::fixed>(wave_deltas, 160));

      if (!wave_hbe.has_value())
      {
        BN_LOG("effects::start_wave_effect: couldn't allocate the H-Blank effect");
      }
    }
  }

  void stop_wave_effect(neo::game* game)
  {
    wave_hbe.reset();

    // Sprites are faked (see update_wave_effect): undo exactly the offset
    // that's currently baked into each rendered sprite's x, regardless of
    // how/when their position was last set.
    if (wave_enabled && (wave_target == "sprite" || wave_target == "both"))
    {
      if (game->player != nullptr)
      {
        game->player->sprite.set_x(game->player->sprite.x() - game->player->wave_offset);
        game->player->wave_offset = 0;
      }

      for (int i = 0; i < game->actors_count; ++i)
      {
        game->actors[i]->sprite.set_x(game->actors[i]->sprite.x() - game->actors[i]->wave_offset);
        game->actors[i]->wave_offset = 0;
      }

      for (int i = 0; i < game->sprites_count; ++i)
      {
        game->sprites[i]->inner_sprite.set_x(
          game->sprites[i]->inner_sprite.x() - game->sprites[i]->wave_offset);
        game->sprites[i]->wave_offset = 0;
      }
    }

    wave_enabled = false;
  }

  void update_wave_effect(neo::game* game)
  {
    if (!wave_enabled)
    {
      return;
    }

    if (wave_frames_remaining > 0)
    {
      wave_frames_remaining--;

      if (wave_frames_remaining == 0)
      {
        stop_wave_effect(game);

        return;
      }
    }

    wave_elapsed_frames++;
    wave_current_amplitude = wave_amplitude * wave_envelope_scale();

    wave_phase += wave_speed;

    while (wave_phase >= 360)
    {
      wave_phase -= 360;
    }

    while (wave_phase < 0)
    {
      wave_phase += 360;
    }

    if (wave_hbe.has_value())
    {
      update_wave_deltas();
      wave_hbe->reload_deltas_ref();
    }

    if (wave_target == "sprite" || wave_target == "both")
    {
      if (game->player != nullptr)
      {
        bn::fixed new_offset = wave_offset_for_y(game->player->sprite.y());
        game->player->sprite.set_x(game->player->sprite.x() - game->player->wave_offset + new_offset);
        game->player->wave_offset = new_offset;
      }

      for (int i = 0; i < game->actors_count; ++i)
      {
        bn::fixed new_offset = wave_offset_for_y(game->actors[i]->sprite.y());
        game->actors[i]->sprite.set_x(
          game->actors[i]->sprite.x() - game->actors[i]->wave_offset + new_offset);
        game->actors[i]->wave_offset = new_offset;
      }

      for (int i = 0; i < game->sprites_count; ++i)
      {
        bn::fixed new_offset = wave_offset_for_y(game->sprites[i]->inner_sprite.y());
        game->sprites[i]->inner_sprite.set_x(
          game->sprites[i]->inner_sprite.x() - game->sprites[i]->wave_offset + new_offset);
        game->sprites[i]->wave_offset = new_offset;
      }
    }
  }

  bool is_wave_enabled()
  {
    return wave_enabled;
  }
}

void neo::types::set_palette_effect_event::start(neo::game* game_)
{
  frame = 0;
  start_value = neo::effects::get_palette_effect(target, effect);
  end_value = value / 100;
  frames = duration->as_int(game_->variables) / 16;

  if (frames <= 0)
  {
    neo::effects::set_palette_effect(target, effect, end_value);
    frames = 0;

    return;
  }

  neo::effects::set_palette_effect(target, effect, start_value);
}

bool neo::types::set_palette_effect_event::update()
{
  if (frames <= 0)
  {
    return true;
  }

  frame++;

  bn::fixed t = bn::fixed(frame) / frames;
  neo::effects::set_palette_effect(target, effect, start_value + (end_value - start_value) * t);

  if (frame < frames)
  {
    return false;
  }

  neo::effects::set_palette_effect(target, effect, end_value);
  frames = 0;

  return true;
}

void neo::types::wave_effect_event::start(neo::game* game_)
{
  game_ref = game_;

  int duration_frames = duration->as_int(game_->variables) / 16;
  frames = duration_frames > 0 ? duration_frames : 0;

  neo::effects::start_wave_effect(
    game_, target, amplitude, speed, frequency, duration_frames, envelope);
}

bool neo::types::wave_effect_event::update()
{
  // duration=0 runs as an ambient effect until the scene changes: treat it
  // as already-done so it doesn't block a parallel-events group forever.
  // Otherwise, the animation itself is advanced every frame by
  // effects::update_wave_effect() (called unconditionally from game::run());
  // this only reports back once that countdown has stopped the effect.
  return frames <= 0 || !neo::effects::is_wave_enabled();
}
