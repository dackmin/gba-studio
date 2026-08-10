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
      position(0, 0),
      moving(false)
  {
    sprite.set_camera(game->camera);
    sprite.set_visible(true);
    sprite.set_bg_priority(1);
    sprite.set_z_order(actor_definition_->z->as_int(game->variables));

    set_direction(definition->direction);
    set_position(definition->x->as_int(game->variables), definition->y->as_int(game->variables));
  }

  actor::~actor()
  {
    sprite.set_visible(false);
  }

  void actor::set_direction (neo::types::direction direction_)
  {
    if (!sprite.visible())
    {
      return;
    }

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

  /**
   * Set position with tiles
   */
  void actor::set_position (int tile_x, int tile_y)
  {
    if (!sprite.visible())
    {
      return;
    }

    position = bn::fixed_point(tile_x, tile_y);

    int x = game->active_scene->map_data->to_pixel_x(game->variables, tile_x)
        - game->active_scene->map_data->pixel_width(game->variables) / 2
        + sprite.dimensions().width() / 2;
    int y = game->active_scene->map_data->to_pixel_y(game->variables, tile_y)
        - game->active_scene->map_data->pixel_height(game->variables) / 2
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
    sprite.remove_camera();
  }

  void actor::enable()
  {
    sprite.set_visible(true);
    sprite.set_camera(game->camera);
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

  void actor::move_to(int tile_x, int tile_y, int speed, bn::string_view direction_priority, bn::string_view animation)
  {
    if (!sprite.visible())
    {
      return;
    }

    moving = true;

    neo::types::map* map_data = game->active_scene->map_data;
    int grid_size = map_data->grid_size->as_int(game->variables);
    int offset_x = -map_data->pixel_width(game->variables) / 2 + sprite.dimensions().width() / 2;
    int offset_y = -map_data->pixel_height(game->variables) / 2 + sprite.dimensions().height() / 2;

    // speed is in tiles/s, running at ~60 FPS
    int px_per_frame = bn::max(1, (speed * grid_size) / 60);

    int origin_x = map_data->to_pixel_x(game->variables, (int)position.x()) + offset_x;
    int origin_y = map_data->to_pixel_y(game->variables, (int)position.y()) + offset_y;
    int target_x = map_data->to_pixel_x(game->variables, tile_x) + offset_x;
    int target_y = map_data->to_pixel_y(game->variables, tile_y) + offset_y;

    int delta_x = target_x - origin_x;
    int delta_y = target_y - origin_y;
    bool horizontal_first = direction_priority != "vertical";
    bn::sprite_tiles_item tiles_item = definition->sprite.tiles_item();

    // Move one axis at a time, one grid step at a time, updating the sprite every frame
    for (int pass = 0; pass < 2; ++pass)
    {
      bool is_horizontal_pass = (pass == 0) == horizontal_first;
      int delta = is_horizontal_pass ? delta_x : delta_y;

      if (delta == 0)
      {
        continue;
      }

      set_direction(is_horizontal_pass
        ? (delta > 0 ? neo::types::direction::RIGHT : neo::types::direction::LEFT)
        : (delta > 0 ? neo::types::direction::DOWN : neo::types::direction::UP));

      // Animation depends on the (possibly just changed) direction, so it's looked up per pass
      neo::types::sprite_animation* anim = animation != "" ? get_animation(animation) : nullptr;

      if (anim != nullptr)
      {
        anim->reset(sprite, &tiles_item);
      }

      int step = delta > 0 ? px_per_frame : -px_per_frame;
      int moved = 0;

      while (abs(moved) < abs(delta))
      {
        moved += step;

        if (abs(moved) > abs(delta))
        {
          moved = delta;
        }

        if (is_horizontal_pass)
        {
          sprite.set_x(origin_x + moved);
        }
        else
        {
          sprite.set_y(origin_y + moved);
        }

        // Play one animation frame
        if (anim != nullptr)
        {
          anim->play(sprite, &tiles_item, game->variables);
        }

        bn::core::update();
      }

      if (is_horizontal_pass)
      {
        origin_x = target_x;
      }
      else
      {
        origin_y = target_y;
      }
    }

    moving = false;
    set_direction(direction); // restore the idle tile for the final facing direction
    set_position(tile_x, tile_y);
  }

  neo::types::sprite_animation* actor::get_animation (bn::string_view id)
  {
    for (int i = 0; i < definition->animations_count; i++)
    {
      neo::types::sprite_animation* animation = definition->animations[i];

      if (animation->_id == id && animation->direction == direction && animation->moving == moving)
      {
        return animation;
      }
    }

    return nullptr;
  }
}
