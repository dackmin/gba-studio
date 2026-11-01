#include <neo_logs.h>

#include <bn_math.h>

#include <neo_types.h>

#include "reaction.h"
#include "game.h"
#include "actor.h"

namespace neo
{
  reaction::reaction(neo::game* game_): game(game_)
  {
  }

  void reaction::show(const neo::types::show_reaction_event* event, const bn::sprite_ptr& anchor)
  {
    if (!anchor.visible())
    {
      return;
    }

    sprite = event->sprite.create_sprite(0, 0);
    sprite->set_camera(game->camera);
    sprite->set_bg_priority(0);
    sprite->set_z_order(anchor.z_order() - 1);

    tiles = event->sprite.tiles_item();
    animation = nullptr;

    for (int i = 0; i < event->animations_count && !event->animation.empty(); ++i)
    {
      const neo::types::sprite_animation* anim = event->animations[i];

      if (anim->_id == event->animation && anim->frames_count > 0)
      {
        animation = anim;
        break;
      }
    }

    if (animation != nullptr)
    {
      animation->reset(playback, *sprite, &*tiles);
    }

    frames_left = bn::max(1, event->duration->as_int(game->variables) / 16);

    update(anchor);
  }

  void reaction::update(const bn::sprite_ptr& anchor)
  {
    if (!sprite.has_value())
    {
      return;
    }

    if (game->scene_changed || frames_left <= 0)
    {
      end();
      return;
    }

    sprite->set_visible(anchor.visible());
    sprite->set_position(
      anchor.x() + anchor.dimensions().width() / 2 - sprite->dimensions().width() / 2,
      anchor.y() - anchor.dimensions().height() / 2 - sprite->dimensions().height() / 2 - GAP
    );

    if (animation != nullptr)
    {
      animation->play(playback, *sprite, &*tiles, game->variables);
    }

    --frames_left;
  }

  void reaction::end()
  {
    sprite.reset();
    tiles.reset();
    animation = nullptr;
    frames_left = 0;
  }
}

void neo::types::show_reaction_event::start()
{
  if (target != nullptr)
  {
    target->reaction.show(this, target->sprite);
  }
}

bool neo::types::show_reaction_event::update()
{
  return target == nullptr || !target->reaction.active();
}

void neo::types::show_actor_reaction_event::init(neo::game* game_)
{
  target = nullptr;
  bn::string_view actor_reference = game_->resolve_actor_reference(actor);

  for (int i = 0; i < game_->actors_count; ++i)
  {
    if (
      game_->actors[i]->definition->name == actor_reference ||
      game_->actors[i]->definition->_id == actor_reference
    )
    {
      target = game_->actors[i];

      break;
    }
  }

  start();
}

void neo::types::show_player_reaction_event::init(neo::game* game_)
{
  target = game_->player;

  start();
}
