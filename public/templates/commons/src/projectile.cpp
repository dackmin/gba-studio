#include <neo_logs.h>

#include <bn_core.h>

#include "projectile.h"
#include "game.h"
#include "actor.h"

namespace neo
{
  projectile::projectile(
    neo::game* game_,
    const neo::types::shoot_projectile_event* definition_
  ) : game(game_),
      definition(definition_),
      sprite(definition_->sprite.create_sprite(0, 0)),
      lifetime(0)
  {
    actor = game->get_actor_by_id(definition_->actor);
  }

  void projectile::update()
  {
    ++lifetime;

    if (lifetime > definition->lifetime)
    {
      game->remove_projectile(this);

      return;
    }

    if (game->active_scene == nullptr)
    {
      return;
    }

    switch (game->active_scene->scene_type)
    {
      case neo::types::scene_type::SIDE_SCROLLER:
        move_with_gravity();
        break;
      default:
        move();
    }
  }

  void projectile::move()
  {
    // TODO
  }

  void projectile::move_with_gravity()
  {
    switch (definition->gravity_style)
    {
      case neo::types::gravity_style::SINUS:
        
    }
  }

  projectile::~projectile()
  {
    sprite.set_visible(false);
  }
}
