#ifndef NEO_PROJECTILE_H
#define NEO_PROJECTILE_H

#include <bn_core.h>
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

      neo::game* game;
      bn::optional<neo::actor*> actor;
      const neo::types::shoot_projectile_event* definition;
      bn::sprite_ptr sprite;
      int lifetime;

      void update();
      void move();
      void move_with_gravity();
  };
}

#endif // NEO_PROJECTILE_H
