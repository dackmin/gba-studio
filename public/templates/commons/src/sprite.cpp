#include <neo_logs.h>

#include <bn_core.h>
#include <bn_sprite_ptr.h>
#include <bn_log.h>

#include <neo_types.h>

#include "sprite.h"
#include "game.h"

namespace neo
{
  sprite::sprite(
    neo::game* game_,
    const neo::types::sprite* sprite_definition_
  ): game(game_),
      definition(sprite_definition_),
      inner_sprite(definition->sprite.create_sprite(0, 0))
  {
    inner_sprite.set_camera(game->camera);
    inner_sprite.set_visible(true);
    inner_sprite.set_bg_priority(1);

    int x = definition->x->as_int(game->variables);
    int y = definition->y->as_int(game->variables);
    int z = definition->z->as_int(game->variables);

    inner_sprite.set_z_order(z);
    set_position(x, y);
  }

  sprite::~sprite()
  {
    inner_sprite.set_visible(false);
  }

  void sprite::set_position (int tile_x, int tile_y)
  {
    position = bn::fixed_point(tile_x, tile_y);

    int x = game->active_scene->map_data->to_pixel_x(game->variables, tile_x)
        - game->active_scene->map_data->pixel_width(game->variables) / 2
        + inner_sprite.dimensions().width() / 2;
    int y = game->active_scene->map_data->to_pixel_y(game->variables, tile_y)
        - game->active_scene->map_data->pixel_height(game->variables) / 2
        + inner_sprite.dimensions().height() / 2;

    inner_sprite.set_x(x);
    inner_sprite.set_y(y);
    wave_offset = 0;
  }

  void sprite::set_item(const bn::sprite_item& item)
  {
    item_replaced = true;
    current_animation = nullptr;
    inner_sprite.set_item(item);
    // Dimensions may differ, so re-anchor on the same tile.
    set_position(position.x().right_shift_integer(), position.y().right_shift_integer());
  }

  void sprite::play_animation(bn::string_view animation)
  {
    current_animation = nullptr;

    if (item_replaced)
    {
      return;
    }

    const neo::types::sprite_animation* fallback = nullptr;

    for (int i = 0; i < definition->animations_count; ++i)
    {
      const neo::types::sprite_animation* candidate = definition->animations[i];

      if (candidate->_id != animation || candidate->frames_count <= 0)
      {
        continue;
      }

      if (
        candidate->type == "fixed" ||
        (candidate->state == neo::types::animation_state::IDLE &&
          candidate->direction == neo::types::direction::DOWN)
      )
      {
        current_animation = candidate;
        break;
      }

      if (fallback == nullptr)
      {
        fallback = candidate;
      }
    }

    if (current_animation == nullptr)
    {
      current_animation = fallback;
    }

    if (current_animation != nullptr)
    {
      bn::sprite_tiles_item tiles_item = definition->sprite.tiles_item();
      current_animation->reset(playback, inner_sprite, &tiles_item);
    }
  }

  void sprite::stop_animation()
  {
    if (current_animation == nullptr)
    {
      return;
    }

    current_animation = nullptr;
    bn::sprite_tiles_item tiles_item = definition->sprite.tiles_item();
    inner_sprite.set_tiles(tiles_item.create_tiles(0));
  }

  void sprite::update_animation()
  {
    if (current_animation == nullptr || !inner_sprite.visible())
    {
      return;
    }

    bn::sprite_tiles_item tiles_item = definition->sprite.tiles_item();
    current_animation->play(playback, inner_sprite, &tiles_item, game->variables);
  }

  void sprite::disable()
  {
    inner_sprite.set_visible(false);
  }

  void sprite::enable()
  {
    inner_sprite.set_visible(true);
  }

  void sprite::init()
  {
    for (int i = 0; i < definition->init_events_count; ++i)
    {
      game->exec_event(definition->init_events[i], false);
    }
  }

  bool sprite::collides(int tile_x, int tile_y)
  {
    if (!inner_sprite.visible())
    {
      return false;
    }

    const neo::types::map* map_data = game->active_scene->map_data;
    int grid_size = map_data->grid_size->as_int(game->variables);
    int tile_left = map_data->to_pixel_x(game->variables, tile_x);
    int tile_top = map_data->to_pixel_y(game->variables, tile_y);
    int left = map_data->to_pixel_x(
      game->variables, position.x().right_shift_integer()) + box_x();
    int top = map_data->to_pixel_y(
      game->variables, position.y().right_shift_integer()) + box_y();

    return left < tile_left + grid_size && left + box_width() > tile_left &&
      top < tile_top + grid_size && top + box_height() > tile_top;
  }

  void sprite::trigger_collide()
  {
    for (int i = 0; i < definition->collide_events_count; ++i)
    {
      game->exec_event(definition->collide_events[i], true);
    }
  }
}
