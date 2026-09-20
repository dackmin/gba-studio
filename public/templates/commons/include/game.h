#ifndef NEO_GAME_H
#define NEO_GAME_H

#include <bn_core.h>
#include <bn_vector.h>
#include <bn_optional.h>
#include <bn_span.h>
#include <bn_regular_bg_ptr.h>
#include <bn_regular_bg_item.h>
#include <bn_regular_bg_position_hbe_ptr.h>
#include <bn_camera_actions.h>

#include <neo_types.h>
#include <neo_variables.h>

#include "commons.h"
#include "actor.h"
#include "sprite.h"
#include "sensor.h"

namespace neo
{
  class game
  {
    public:
      game();
      game(bn::camera_ptr& camera_ptr);

      bn::string_view current_scene;
      bool scene_changed;

      bn::camera_ptr& camera;
      neo::variables::registry variables;

      neo::types::scene* active_scene;
      bn::optional<bn::regular_bg_ptr> scene_bg;
      neo::types::scene_event* last_goto_event;

      int scripted_events_count;
      bn::vector<neo::types::event*, 100> scripted_events;

      int actors_count;
      bn::vector<neo::actor*, 20> actors;

      int sprites_count;
      bn::vector<neo::sprite*, 50> sprites;

      int sensors_count;
      bn::vector<neo::sensor*, 50> sensors;

      bool is_input_enabled;

      neo::actor* player;
      // Actor the camera currently tracks as it moves (nullptr if none).
      neo::actor* camera_target;

      // Parallel-events nodes with resumable (fade-in/out, move-camera-to,
      // move-actor-to, move-player-to, set-palette-effect, wave-effect)
      // sub-events, ticked once per frame by update_active_parallel_events()
      // while the "parallel-events" handler blocks the rest of the script
      // on each node's pending list (see exec_event()). Sub-events run
      // concurrently with each other, but the node itself still waits for
      // all of them to finish.
      bn::vector<neo::types::parallel_event*, 10> active_parallel_events;

      // Per-scanline horizontal wave distortion applied to the scene
      // background and/or actors/sprites, ticked once per frame by
      // update_wave_effect() while enabled (see the wave-effect event).
      bool wave_enabled = false;
      bn::string_view wave_target = "both"; // "background" | "sprite" | "both"
      bn::string_view wave_envelope = "in"; // "in" (0%->100%) | "in-out" (0%->100%->0%)
      bn::fixed wave_amplitude = 0; // configured (max) amplitude
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

      void set_scene(bn::string_view scene_name);
      void set_background(bn::regular_bg_item background, bool visible = false);
      void exec_event(const neo::types::event* e, bool is_loop);
      void run();
      void enable_blending();
      void disable_blending();
      void update_active_parallel_events();
      // Advances one frame, including any active parallel effects. Every
      // blocking wait loop (dialog/menu, wait/wait-for-button, blocking
      // fade/pan/actor-move, ...) must tick through this instead of calling
      // bn::core::update() directly, otherwise a parallel-events node
      // (e.g. a camera pan + wave running alongside a fade-in) would freeze
      // for as long as that other event blocks.
      void update_frame();
      // Same idea as neo::utils::wait(), but goes through update_frame().
      void wait(int milliseconds);
      void start_wave_effect(
        bn::string_view target, bn::fixed amplitude, bn::fixed speed, int frequency, int duration_frames,
        bn::string_view envelope);
      void update_wave_effect();
      bool has_collision(int tile_x, int tile_y);
      neo::actor* get_actor_at(int tile_x, int tile_y, neo::types::direction direction);
      neo::sprite* get_sprite_at(int tile_x, int tile_y, neo::types::direction direction);
      neo::sensor* get_sensor_at(int tile_x, int tile_y);
      bool evaluate_condition(neo::types::if_expression* condition);
      bn::string_view get_expression_value(neo::types::if_expression* expression);

    private:
      void update_wave_deltas();
      bn::fixed wave_offset_for_y(bn::fixed y);
      bn::fixed wave_envelope_scale();
      void stop_wave_effect();
  };
}

#endif
