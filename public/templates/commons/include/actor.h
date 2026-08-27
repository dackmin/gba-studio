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
      actor(neo::game* game, neo::types::actor* actor_definition, bool is_player = false);
      ~actor();

      inline constexpr static int PLAYER_SPEED = 2; // slow: 1, faster: 2

      void init();
      void update();
      void set_direction(neo::types::direction direction);
      void set_position(int tile_x, int tile_y);
      void set_position(bn::fixed_point pixel_position);
      void set_z_order(int z);
      void move_to(int tile_x, int tile_y, int speed, bn::string_view direction_priority, bn::string_view animation);
      bool collides(int tile_x, int tile_y);
      void disable();
      void enable();

      neo::types::sprite_animation* get_animation(bn::string_view type);

      // Player-only
      void check_input();
      neo::types::direction opposite_direction();
      int width();
      int height();

      neo::game* game;
      neo::types::actor* definition;
      bn::sprite_ptr sprite;
      bn::fixed_point position;
      neo::types::direction direction;
      bool moving;
      bool is_player;

    private:
      void move(neo::types::sprite_animation* anim);
  };
}


#endif
