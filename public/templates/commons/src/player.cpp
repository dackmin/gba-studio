#include <bn_core.h>
#include <bn_keypad.h>
#include <bn_sprite_ptr.h>
#include <bn_camera_actions.h>
#include <bn_sprite_tiles_ptr.h>
#include <bn_sprite_animate_actions.h>

#include <bn_sprite_items_sprite_default.h>

#include "neo_types.h"
#include "player.h"
#include "game.h"
#include "commons.h"

namespace neo
{
  player::player():
      sprite(bn::sprite_items::sprite_default.create_sprite(0, 0)),
      position(0, 0),
      direction(neo::types::direction::DOWN),
      map(nullptr)
  {
    sprite.set_visible(false);
    sprite.set_bg_priority(1);
    sprite.set_z_order(1);
  }

  void player::play(neo::types::map& map_, int start_tile_x, int start_tile_y, neo::types::direction start_direction)
  {
    sprite.set_camera(game->camera);
    set_map(map_);
    set_position(bn::fixed_point(map->to_pixel_x(start_tile_x), map->to_pixel_y(start_tile_y)));
    direction = start_direction;

    if (start_direction == neo::types::direction::LEFT)
    {
        sprite.set_tiles(bn::sprite_items::sprite_default.tiles_item().create_tiles(neo::tileindex::LEFT));
        sprite.set_horizontal_flip(true);
    }
    else if (start_direction == neo::types::direction::RIGHT)
    {
      sprite.set_tiles(bn::sprite_items::sprite_default.tiles_item().create_tiles(neo::tileindex::RIGHT));
      sprite.set_horizontal_flip(false);
    }
    else if (start_direction == neo::types::direction::UP)
    {
      sprite.set_tiles(bn::sprite_items::sprite_default.tiles_item().create_tiles(neo::tileindex::UP));
    }
    else
    {
      sprite.set_tiles(bn::sprite_items::sprite_default.tiles_item().create_tiles(neo::tileindex::DOWN));
    }

    sprite.set_visible(true);
  }

  void player::update()
  {
    if (bn::keypad::a_pressed())
    {
      neo::actor* actor = game->get_actor_at(
        map->to_tile_x((int)position.x()),
        map->to_tile_y((int)position.y()),
        direction
      );

      if (actor != nullptr && game->active_scene != nullptr && actor->definition->interact_events != nullptr)
      {
        actor->set_direction(opposite_direction());
        for (int i = 0; i < actor->definition->interact_events_count; i++)
        {
          game->exec_event(actor->definition->interact_events[i], true);
        }

        bn::core::update();
        return;
      }
    }

    if (bn::keypad::left_pressed() || bn::keypad::left_held())
    {
      direction = neo::types::direction::LEFT;
      sprite.set_tiles(bn::sprite_items::sprite_default.tiles_item().create_tiles(neo::tileindex::LEFT));
      sprite.set_horizontal_flip(true);

      if (bn::keypad::left_held())
      {
        bn::sprite_animate_action<4> action = bn::create_sprite_animate_action_forever(
          sprite,
          ANIMATION_FPS,
          bn::sprite_items::sprite_default.tiles_item(),
          8, 2, 9, 2
        );

        while (bn::keypad::left_held())
        {
          move(action);
        }

        action.reset();
        sprite.set_tiles(bn::sprite_items::sprite_default.tiles_item().create_tiles(neo::tileindex::LEFT));
      }
    }
    else if (bn::keypad::right_pressed() || bn::keypad::right_held())
    {
      direction = neo::types::direction::RIGHT;
      sprite.set_tiles(bn::sprite_items::sprite_default.tiles_item().create_tiles(neo::tileindex::RIGHT));
      sprite.set_horizontal_flip(false);

      if (bn::keypad::right_held())
      {
        bn::sprite_animate_action<4> action = bn::create_sprite_animate_action_forever(
          sprite,
          ANIMATION_FPS,
          bn::sprite_items::sprite_default.tiles_item(),
          8, 2, 9, 2
        );

        while (bn::keypad::right_held())
        {
          move(action);
        }

        action.reset();
        sprite.set_tiles(bn::sprite_items::sprite_default.tiles_item().create_tiles(neo::tileindex::RIGHT));
      }
    }

    if (bn::keypad::up_pressed() || bn::keypad::up_held())
    {
      direction = neo::types::direction::UP;
      sprite.set_tiles(bn::sprite_items::sprite_default.tiles_item().create_tiles(neo::tileindex::UP));

      if (bn::keypad::up_held())
      {
        bn::sprite_animate_action<4> action = bn::create_sprite_animate_action_forever(
          sprite,
          ANIMATION_FPS,
          bn::sprite_items::sprite_default.tiles_item(),
          6, 1, 7, 1
        );

        while (bn::keypad::up_held())
        {
          move(action);
        }

        action.reset();
        sprite.set_tiles(bn::sprite_items::sprite_default.tiles_item().create_tiles(neo::tileindex::UP));
      }
    }
    else if (bn::keypad::down_pressed() || bn::keypad::down_held())
    {
      direction = neo::types::direction::DOWN;
      sprite.set_tiles(bn::sprite_items::sprite_default.tiles_item().create_tiles(neo::tileindex::DOWN));

      if (bn::keypad::down_held())
      {
        bn::sprite_animate_action<4> action = bn::create_sprite_animate_action_forever(
          sprite,
          ANIMATION_FPS,
          bn::sprite_items::sprite_default.tiles_item(),
          4, 0, 5, 0
        );

        while (bn::keypad::down_held())
        {
          move(action);
        }

        action.reset();
        sprite.set_tiles(bn::sprite_items::sprite_default.tiles_item().create_tiles(neo::tileindex::DOWN));
      }
    }
  }

  void player::move(bn::sprite_animate_action<4>& action)
  {
    int next_x = (int)position.x();
    int next_y = (int)position.y();

    switch (direction)
    {
      case neo::types::direction::LEFT:
        next_x -= map->grid_size;
        break;
      case neo::types::direction::RIGHT:
        next_x += map->grid_size;
        break;
      case neo::types::direction::UP:
        next_y -= map->grid_size;
        break;
      default:
        next_y += map->grid_size;
        break;
    }

    int tile_x = map->to_tile_x(next_x);
    int tile_y = map->to_tile_y(next_y);

    if (map->has_collision(tile_x, tile_y) || game->has_collision(tile_x, tile_y))
    {
      action.update();
      bn::core::update();

      return;
    }

    int delta = 0;

    while (delta < map->grid_size)
    {
      switch (direction)
      {
        case neo::types::direction::LEFT:
          position.set_x(position.x() - PLAYER_SPEED);
          break;
        case neo::types::direction::RIGHT:
          position.set_x(position.x() + PLAYER_SPEED);
          break;
        case neo::types::direction::UP:
          position.set_y(position.y() - PLAYER_SPEED);
          break;
        default:
          position.set_y(position.y() + PLAYER_SPEED);
          break;
      }

      set_position(position);
      delta += PLAYER_SPEED;
      action.update();
      bn::core::update();
    }

    neo::types::sensor* sensor = map->get_sensor(tile_x, tile_y);
    if (sensor != nullptr && game->active_scene != nullptr && sensor->events != nullptr)
    {
      for (int i = 0; i < sensor->events_count; i++)
      {
        game->exec_event(sensor->events[i], true);
      }

      action.update();
      bn::core::update();

      return;
    }
  }

  void player::set_position(bn::fixed_point position_)
  {
    position = position_;
    int x = (int)position.x() - map->pixel_width() / 2;
    int y = (int)position.y() - map->pixel_height() / 2;
    sprite.set_x(x + width() / 2);
    sprite.set_y(y + height() / 2);

    game->camera.set_x(bn::min(
      bn::max(x, -(map->pixel_width() / 2 - neo::types::SCREEN_WIDTH / 2)),
      map->pixel_width() / 2 - neo::types::SCREEN_WIDTH / 2
    ));
    game->camera.set_y(bn::min(
      bn::max(y, -(map->pixel_height() / 2 - neo::types::SCREEN_HEIGHT / 2)),
      map->pixel_height() / 2 - neo::types::SCREEN_HEIGHT / 2
    ));
  }

  void player::set_game(neo::game& game_)
  {
    game = &game_;
  }

  void player::set_map(neo::types::map& map_)
  {
    map = &map_;
  }

  int player::width()
  {
    return sprite.dimensions().width();
  };

  int player::height()
  {
    return sprite.dimensions().height();
  };

  neo::types::direction player::opposite_direction()
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
}
