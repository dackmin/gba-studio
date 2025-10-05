#ifndef NEO_ACTOR_H
#define NEO_ACTOR_H

#include <bn_core.h>
#include <bn_sprite_ptr.h>

#include <neo_types.h>

namespace neo
{
  class game;

  class actor
  {
    public:
      actor(neo::game* game, neo::types::actor* actor_definition);
      ~actor(); // Destructor - called automatically when delete is used

      void init();
      void update();
      void set_direction(neo::types::direction direction);
      void set_position(int tile_x, int tile_y);
      bool collides(int tile_x, int tile_y);
      void disable();
      void enable();

      neo::game* game;
      neo::types::actor* definition;
      bn::sprite_ptr sprite;
      bn::fixed_point position;
      neo::types::direction direction;
  };
}

#endif
