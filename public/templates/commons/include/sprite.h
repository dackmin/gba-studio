#ifndef NEO_SPRITE_H
#define NEO_SPRITE_H

#include <bn_core.h>
#include <bn_sprite_ptr.h>

#include <neo_types.h>

namespace neo
{
  class game;

  class sprite
  {
    public:
      sprite(neo::game* game, neo::types::sprite* sprite_definition);
      ~sprite(); // Destructor - called automatically when delete is used

      void set_position(int tile_x, int tile_y);
      void disable();
      void enable();

      neo::game* game;
      neo::types::sprite* definition;
      bn::sprite_ptr inner_sprite;
      bn::fixed_point position;
  };
}

#endif
