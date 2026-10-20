#ifndef NEO_PROJECTILE_H
#define NEO_PROJECTILE_H

#include <bn_core.h>
#include <bn_fixed_point.h>
#include <bn_sprite_ptr.h>

#include <neo_types.h>

namespace neo
{
  class game;

  class projectile
  {
    public:
      projectile(
        neo::game* game_,
        const neo::types::shoot_projectile_event* definition_
      );
      ~projectile();

      inline constexpr static bn::fixed SINUS_GRAVITY = 0.3;
      inline constexpr static bn::fixed SINUS_BOUNCE_VELOCITY = 3;
      inline constexpr static bn::fixed SINUS_MAX_FALL = 4;

      inline constexpr static bn::fixed ARC_GRAVITY = 0.1;
      inline constexpr static bn::fixed ARC_MAX_FALL = 4;
      inline constexpr static int ARC_ANGLE = 60;

      inline constexpr static bn::fixed NORMAL_GRAVITY = 0.001;
      inline constexpr static bn::fixed NORMAL_MAX_FALL = 4;

      neo::game* game;
      const neo::types::shoot_projectile_event* definition;
      neo::actor* actor;
      bn::sprite_ptr sprite;
      int lifetime;

      bn::fixed_point position;
      bn::fixed_point heading;
      bn::fixed_point velocity;

      void update();
      bool move();
      bool move_with_gravity();
      bool move_bouncing();
      bool move_arc();
      bool move_custom();

    private:
      bool touching_player = false;
      // Using bits to save some memory
      unsigned touching_actors = 0;
      // Scenes can have 50 sprites, so shit doesn't fit within a single 32-bit int,
      // we have to use 64-bit
      uint64_t touching_sprites = 0;

      bool check_collisions();
      template<typename Target>
      bool touch(
        Target* other,
        const bn::sprite_ptr& other_sprite,
        bool can_collide,
        bool& touching
      );
      bool blocked_at(int x, int y);
      bool gravity_enabled();
      int horizontal_side();
      neo::types::direction resolve_direction();
      static bn::fixed_point direction_to_heading(neo::types::direction direction);
  };
}

#endif // NEO_PROJECTILE_H
