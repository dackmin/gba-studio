#ifndef NEO_GAME_H
#define NEO_GAME_H

#include <bn_core.h>
#include <bn_vector.h>
#include <bn_camera_actions.h>

#include <neo_types.h>
#include <neo_variables.h>

#include "player.h"
#include "commons.h"
#include "actor.h"

namespace neo
{
  class game
  {
    public:
      game();
      game(bn::camera_ptr& camera_ptr, neo::player& player);

      bn::string_view current_scene;
      bool scene_changed;

      bn::camera_ptr& camera;
      neo::player& player;
      neo::variables::registry variables;

      neo::types::scene* active_scene;
      bn::regular_bg_ptr* scene_bg;
      neo::types::scene_event* last_goto_event;

      int scripted_events_count;
      bn::vector<neo::types::event*, 100> scripted_events;

      int actors_count;
      bn::vector<neo::actor*, 20> actors;

      void set_scene(bn::string_view scene_name);
      void exec_event(const neo::types::event* e, bool is_loop);
      void run();
      void enable_blending();
      void disable_blending();
      bool has_collision(int tile_x, int tile_y);
      neo::actor* get_actor_at(int tile_x, int tile_y, neo::types::direction direction);
      bool evaluate_condition(neo::types::if_condition* condition);
      bn::string_view get_expression_value(neo::types::if_expression* expression);
  };
}

#endif
