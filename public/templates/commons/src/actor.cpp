#include <bn_core.h>
#include <bn_sprite_ptr.h>

#include <neo_types.h>

#include "actor.h"
#include "game.h"

namespace neo
{
  actor::actor(
    neo::game* game_,
    neo::types::actor* actor_definition_
  ) : game(game_),
      definition(actor_definition_),
      sprite(definition->sprite.create_sprite(0, 0)),
      position(0, 0)
  {
    sprite.set_camera(game->camera);
    sprite.set_visible(true);
    sprite.set_bg_priority(1);

    set_direction(definition->direction);
    set_position(definition->x, definition->y);
  }

  actor::~actor()
  {
    sprite.set_visible(false);
  }

  void actor::set_direction (neo::types::direction direction_)
  {
    direction = direction_;

    if (direction == neo::types::direction::LEFT)
    {
      sprite.set_tiles(definition->sprite.tiles_item().create_tiles(neo::tileindex::LEFT));
      sprite.set_horizontal_flip(true);
    }
    else if (direction == neo::types::direction::RIGHT)
    {
      sprite.set_tiles(definition->sprite.tiles_item().create_tiles(neo::tileindex::RIGHT));
      sprite.set_horizontal_flip(false);
    }
    else if (direction == neo::types::direction::UP)
    {
      sprite.set_tiles(definition->sprite.tiles_item().create_tiles(neo::tileindex::UP));
    }
    else
    {
      sprite.set_tiles(definition->sprite.tiles_item().create_tiles(neo::tileindex::DOWN));
    }
  }

  void actor::set_position (int tile_x, int tile_y)
  {
    position = bn::fixed_point(tile_x, tile_y);

    int x = game->active_scene->map_data->to_pixel_x(tile_x)
        - game->active_scene->map_data->pixel_width() / 2
        + sprite.dimensions().width() / 2;
    int y = game->active_scene->map_data->to_pixel_y(tile_y)
        - game->active_scene->map_data->pixel_height() / 2
        + sprite.dimensions().height() / 2;

    sprite.set_x(x);
    sprite.set_y(y);
  }

  bool actor::collides(int tile_x, int tile_y)
  {
    if (!sprite.visible())
    {
      return false;
    }

    return (tile_x == position.x().right_shift_integer())
      && (tile_y == position.y().right_shift_integer());
  }

  void actor::disable()
  {
    sprite.set_visible(false);
  }

  void actor::enable()
  {
    sprite.set_visible(true);
  }

  void actor::init()
  {
    for (int i = 0; i < definition->init_events_count; ++i)
    {
      game->exec_event(definition->init_events[i], false);
    }
  }

  void actor::update()
  {
    for (int i = 0; i < definition->update_events_count; ++i)
    {
      game->exec_event(definition->update_events[i], true);
    }
  }
}
