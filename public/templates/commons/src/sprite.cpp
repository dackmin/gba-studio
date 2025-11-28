#define BN_CFG_LOG_ENABLED true

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
    neo::types::sprite* sprite_definition_
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
  }

  void sprite::disable()
  {
    inner_sprite.set_visible(false);
  }

  void sprite::enable()
  {
    inner_sprite.set_visible(true);
  }
}
