#define BN_CFG_LOG_ENABLED true

#include <bn_core.h>
#include <bn_keypad.h>
#include <bn_sprite_ptr.h>
#include <bn_log.h>

#include <neo_types.h>

#include "actor.h"
#include "game.h"
#include "commons.h"

namespace neo
{
  actor::actor(
    neo::game* game_,
    neo::types::actor* actor_definition_,
    bool is_player_
  ) : game(game_),
      definition(actor_definition_),
      sprite(definition->sprite.create_sprite(0, 0)),
      position(0, 0),
      moving(false),
      is_player(is_player_)
  {
    sprite.set_camera(game->camera);
    sprite.set_visible(true);
    sprite.set_bg_priority(1);
    sprite.set_z_order(actor_definition_->z->as_int(game->variables));

    set_direction(definition->direction);

    if (is_player)
    {
      neo::types::map* map_data = game->active_scene->map_data;
      int grid_size = map_data->grid_size->as_int(game->variables);
      int tile_x = definition->x->as_int(game->variables);
      int tile_y = definition->y->as_int(game->variables);
      int px = tile_x * grid_size;
      int py = tile_y * grid_size;
      set_position(bn::fixed_point(px, py));
    }
    else
    {
      set_position(definition->x->as_int(game->variables), definition->y->as_int(game->variables));
    }
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

  /**
   * Set position with pixels, following with the camera (main player actor only)
   */
  void actor::set_position (bn::fixed_point pixel_position)
  {
    position = pixel_position;

    neo::types::map* map_data = game->active_scene->map_data;
    int x = (int)position.x() - map_data->pixel_width(game->variables) / 2;
    int y = (int)position.y() - map_data->pixel_height(game->variables) / 2;
    sprite.set_x(x + width() / 2);
    sprite.set_y(y + height() / 2);

    game->camera.set_x(bn::min(
      bn::max(x, -(map_data->pixel_width(game->variables) / 2 - neo::types::SCREEN_WIDTH / 2)),
      map_data->pixel_width(game->variables) / 2 - neo::types::SCREEN_WIDTH / 2
    ));
    game->camera.set_y(bn::min(
      bn::max(y, -(map_data->pixel_height(game->variables) / 2 - neo::types::SCREEN_HEIGHT / 2)),
      map_data->pixel_height(game->variables) / 2 - neo::types::SCREEN_HEIGHT / 2
    ));
  }

  void actor::set_z_order(int z)
  {
    sprite.set_z_order(z);
  }

  bool actor::collides(int tile_x, int tile_y)
  {
    if (!sprite.visible())
    {
      return false;
    }

    if (is_player)
    {
      neo::types::map* map_data = game->active_scene->map_data;
      int player_tile_x = map_data->to_tile_x(game->variables, (int)position.x());
      int player_tile_y = map_data->to_tile_y(game->variables, (int)position.y());
      return tile_x == player_tile_x && tile_y == player_tile_y;
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
    if (is_player)
    {
      if (game->is_input_enabled)
      {
        check_input();
      }

      return;
    }

    for (int i = 0; i < definition->update_events_count; ++i)
    {
      game->exec_event(definition->update_events[i], true);
    }
  }

  void actor::check_input()
  {
    neo::types::map* map_data = game->active_scene->map_data;
    bn::sprite_tiles_item tiles_item = definition->sprite.tiles_item();

    if (bn::keypad::a_pressed())
    {
      neo::actor* other = game->get_actor_at(
        map_data->to_tile_x(game->variables, (int)position.x()),
        map_data->to_tile_y(game->variables, (int)position.y()),
        direction
      );

      if (other != nullptr && game->active_scene != nullptr && other->definition->interact_events != nullptr)
      {
        other->set_direction(opposite_direction());
        for (int i = 0; i < other->definition->interact_events_count; i++)
        {
          game->exec_event(other->definition->interact_events[i], true);
        }

        bn::core::update();
        return;
      }
    }

    if (bn::keypad::left_pressed() || bn::keypad::left_held())
    {
      direction = neo::types::direction::LEFT;
      sprite.set_tiles(tiles_item.create_tiles(neo::tileindex::LEFT));
      sprite.set_horizontal_flip(true);

      if (bn::keypad::left_held())
      {
        moving = true;
        neo::types::sprite_animation* anim = definition->animations_count > 0
          ? get_animation(definition->animations[0]->_id)
          : nullptr;

        if (anim != nullptr)
        {
          anim->reset(sprite, &tiles_item);
        }

        while (bn::keypad::left_held())
        {
          move(anim);
        }

        moving = false;
        set_direction(direction);
      }
    }
    else if (bn::keypad::right_pressed() || bn::keypad::right_held())
    {
      direction = neo::types::direction::RIGHT;
      sprite.set_tiles(tiles_item.create_tiles(neo::tileindex::RIGHT));
      sprite.set_horizontal_flip(false);

      if (bn::keypad::right_held())
      {
        moving = true;
        neo::types::sprite_animation* anim = definition->animations_count > 0
          ? get_animation(definition->animations[0]->_id)
          : nullptr;

        if (anim != nullptr)
        {
          anim->reset(sprite, &tiles_item);
        }

        while (bn::keypad::right_held())
        {
          move(anim);
        }

        moving = false;
        set_direction(direction);
      }
    }

    if (bn::keypad::up_pressed() || bn::keypad::up_held())
    {
      direction = neo::types::direction::UP;
      sprite.set_tiles(tiles_item.create_tiles(neo::tileindex::UP));

      if (bn::keypad::up_held())
      {
        moving = true;
        neo::types::sprite_animation* anim = definition->animations_count > 0
          ? get_animation(definition->animations[0]->_id)
          : nullptr;

        if (anim != nullptr)
        {
          anim->reset(sprite, &tiles_item);
        }

        while (bn::keypad::up_held())
        {
          move(anim);
        }

        moving = false;
        set_direction(direction);
      }
    }
    else if (bn::keypad::down_pressed() || bn::keypad::down_held())
    {
      direction = neo::types::direction::DOWN;
      sprite.set_tiles(tiles_item.create_tiles(neo::tileindex::DOWN));

      if (bn::keypad::down_held())
      {
        moving = true;
        neo::types::sprite_animation* anim = definition->animations_count > 0
          ? get_animation(definition->animations[0]->_id)
          : nullptr;

        if (anim != nullptr)
        {
          anim->reset(sprite, &tiles_item);
        }

        while (bn::keypad::down_held())
        {
          move(anim);
        }

        moving = false;
        set_direction(direction);
      }
    }
  }

  void actor::move(neo::types::sprite_animation* anim)
  {
    neo::types::map* map_data = game->active_scene->map_data;
    bn::sprite_tiles_item tiles_item = definition->sprite.tiles_item();

    int next_x = (int)position.x();
    int next_y = (int)position.y();

    switch (direction)
    {
      case neo::types::direction::LEFT:
        next_x -= map_data->grid_size->as_int(game->variables);
        break;
      case neo::types::direction::RIGHT:
        next_x += map_data->grid_size->as_int(game->variables);
        break;
      case neo::types::direction::UP:
        next_y -= map_data->grid_size->as_int(game->variables);
        break;
      default:
        next_y += map_data->grid_size->as_int(game->variables);
        break;
    }

    int tile_x = map_data->to_tile_x(game->variables, next_x);
    int tile_y = map_data->to_tile_y(game->variables, next_y);

    if (map_data->has_collision(tile_x, tile_y) || game->has_collision(tile_x, tile_y))
    {
      bn::core::update();

      return;
    }

    int delta = 0;
    bn::fixed_point pixel_position = position;

    while (delta < map_data->grid_size->as_int(game->variables))
    {
      switch (direction)
      {
        case neo::types::direction::LEFT:
          pixel_position.set_x(pixel_position.x() - PLAYER_SPEED);
          break;
        case neo::types::direction::RIGHT:
          pixel_position.set_x(pixel_position.x() + PLAYER_SPEED);
          break;
        case neo::types::direction::UP:
          pixel_position.set_y(pixel_position.y() - PLAYER_SPEED);
          break;
        default:
          pixel_position.set_y(pixel_position.y() + PLAYER_SPEED);
          break;
      }

      set_position(pixel_position);
      delta += PLAYER_SPEED;

      if (anim != nullptr)
      {
        anim->play(sprite, &tiles_item, game->variables);
      }

      bn::core::update();
    }

    neo::types::sensor* sensor = map_data->get_sensor(tile_x, tile_y);
    if (sensor != nullptr && game->active_scene != nullptr && sensor->events != nullptr)
    {
      for (int i = 0; i < sensor->events_count; i++)
      {
        game->exec_event(sensor->events[i], true);
      }

      if (anim != nullptr)
      {
        anim->play(sprite, &tiles_item, game->variables);
      }

      bn::core::update();

      return;
    }
  }

  int actor::width()
  {
    return sprite.dimensions().width();
  }

  int actor::height()
  {
    return sprite.dimensions().height();
  }

  neo::types::direction actor::opposite_direction()
  {
    switch (direction)
    {
      case neo::types::direction::LEFT:
        return neo::types::direction::RIGHT;
      case neo::types::direction::RIGHT:
        return neo::types::direction::LEFT;
      case neo::types::direction::UP:
        return neo::types::direction::DOWN;
      default:
        return neo::types::direction::UP;
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

