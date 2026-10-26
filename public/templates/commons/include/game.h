#ifndef NEO_GAME_H
#define NEO_GAME_H

#include <bn_core.h>
#include <bn_vector.h>
#include <bn_optional.h>
#include <bn_span.h>
#include <bn_sprite_ptr.h>
#include <bn_camera_actions.h>

#include <neo_types.h>
#include <neo_variables.h>

#include "commons.h"
#include "actor.h"
#include "sprite.h"
#include "sensor.h"
#include "projectile.h"
#include "scene_bg.h"

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
      neo::scene_bg scene_bg;
      neo::types::scene_event* last_goto_event;

      int scripted_events_count;
      bn::vector<neo::types::event*, 100> scripted_events;

      int actors_count;
      bn::vector<neo::actor*, 20> actors;

      int sprites_count;
      bn::vector<neo::sprite*, 50> sprites;

      int projectiles_count;
      bn::vector<neo::projectile*, 100> projectiles;

      // Screen-fixed sprites of the active scene's HUD (no camera attached)
      bn::vector<bn::sprite_ptr, 30> hud_sprites;
      // Glyph sprites of the HUD texts, rebuilt when a resolved text changes
      bn::vector<bn::sprite_ptr, 64> hud_text_sprites;
      unsigned hud_text_hash = 0;
      // Current content of each HUD text (set-hud-text swaps entries)
      bn::vector<const neo::types::event_value*, 20> hud_text_content;

      int sensors_count;
      bn::vector<neo::sensor*, 50> sensors;

      bool is_input_enabled;

      neo::actor* player;
      // Actor the camera currently tracks as it moves (nullptr if none).
      neo::actor* camera_target;

      bn::string_view active_collision_side;

      // Parallel-events nodes with resumable (fade-in/out, move-camera-to,
      // move-actor-to, move-player-to, set-palette-effect, wave-effect)
      // sub-events, ticked once per frame by update_active_parallel_events()
      // while the "parallel-events" handler blocks the rest of the script
      // on each node's pending list (see exec_event()). Sub-events run
      // concurrently with each other, but the node itself still waits for
      // all of them to finish.
      bn::vector<neo::types::parallel_event*, 10> active_parallel_events;

      void set_scene(bn::string_view scene_name);
      void reset();
      bn::string_view resolve_actor_reference(bn::string_view actor_reference);
      void set_background(const neo::types::background& background, bool visible = false);
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
      void update_scripted_events();
      void update_frame();
      void update_projectiles();
      // Same idea as neo::utils::wait(), but goes through update_frame().
      void wait(int milliseconds);
      bool has_collision(int tile_x, int tile_y);
      neo::actor* get_actor_by_id(bn::string_view id);
      neo::actor* get_actor_at(int tile_x, int tile_y, neo::types::direction direction);
      neo::sprite* get_sprite_at(int tile_x, int tile_y, neo::types::direction direction);
      neo::sensor* get_sensor_at(int tile_x, int tile_y);
      void remove_projectile(neo::projectile* projectile);
  };
}

#endif
