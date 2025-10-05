#ifndef NEO_PLAYER_H
#define NEO_PLAYER_H

#include <bn_core.h>
#include <bn_sprite_ptr.h>
#include <bn_camera_actions.h>
#include <bn_sprite_animate_actions.h>

#include "neo_types.h"
#include "commons.h"

namespace neo
{
  class game;

  class player
  {
    public:
      player();

      inline static int ANIMATION_FPS = 7; // slow: 12, faster: 7
      inline static int PLAYER_SPEED = 2; // slow: 1, faster: 2

      void set_game(neo::game& game);
      void set_map(neo::types::map& map);
      void set_position(bn::fixed_point position);
      void play(neo::types::map& map, int start_x, int start_y, neo::types::direction start_direction);
      void update();
      void move(bn::sprite_animate_action<4>& action);
      int width();
      int height();
      neo::types::direction opposite_direction();

      bn::sprite_ptr sprite;
      bn::fixed_point position;
      neo::types::direction direction;

      neo::game* game;
      neo::types::map* map;
  };
}

#endif
