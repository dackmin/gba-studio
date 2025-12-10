#define BN_CFG_LOG_ENABLED true

#include <bn_core.h>
#include <bn_log.h>
#include <bn_sprite_item.h>

#include <bn_sprite_items_textbox.h>

#include <neo_types.h>

#include "menu.h"
#include "game.h"
#include "buttons.h"
#include "utils.h"

namespace neo
{
  menu::menu (neo::game* game_, const bn::vector<neo::types::menu_choice, MAX_ITEMS>& choices_):
    game(game_),
    choices(choices_),
    direction(neo::types::direction::DOWN_RIGHT)
  {}

  void menu::show ()
  {
    bn::sprite_tiles_item tiles = bn::sprite_items::textbox.tiles_item();

    bn::sprite_ptr bg_top_left = bn::sprite_items::textbox.create_sprite(0, 0);
    bg_top_left.set_tiles(tiles.create_tiles(0));
    bg_top_left.set_visible(true);
    bg_top_left.set_bg_priority(0);
    bg_top_left.set_z_order(-1000);

    bn::sprite_ptr bg_down_left = bn::sprite_items::textbox.create_sprite(0, 32);
    bg_down_left.set_tiles(tiles.create_tiles(1));
    bg_down_left.set_visible(true);
    bg_down_left.set_bg_priority(0);
    bg_down_left.set_z_order(-1000);

    bn::sprite_ptr bg_top_right = bn::sprite_items::textbox.create_sprite(32, 0);
    bg_top_right.set_tiles(tiles.create_tiles(2));
    bg_top_right.set_visible(true);
    bg_top_right.set_bg_priority(0);
    bg_top_right.set_z_order(-1000);

    bn::sprite_ptr bg_down_right = bn::sprite_items::textbox.create_sprite(32, 32);
    bg_down_right.set_tiles(tiles.create_tiles(3));
    bg_down_right.set_visible(true);
    bg_down_right.set_bg_priority(0);
    bg_down_right.set_z_order(-1000);

    bn::sprite_ptr bg_top = bn::sprite_items::textbox.create_sprite(16, 0);
    bg_top.set_tiles(tiles.create_tiles(4));
    bg_top.set_visible(true);
    bg_top.set_bg_priority(0);
    bg_top.set_z_order(-1000);

    bn::sprite_ptr bg_down = bn::sprite_items::textbox.create_sprite(16, 32);
    bg_down.set_tiles(tiles.create_tiles(5));
    bg_down.set_visible(true);
    bg_down.set_bg_priority(0);
    bg_down.set_z_order(-1000);

    bn::sprite_ptr bg_right = bn::sprite_items::textbox.create_sprite(32, 16);
    bg_right.set_tiles(tiles.create_tiles(6));
    bg_right.set_visible(true);
    bg_right.set_bg_priority(0);
    bg_right.set_z_order(-1000);

    bn::sprite_ptr bg_left = bn::sprite_items::textbox.create_sprite(0, 16);
    bg_left.set_tiles(tiles.create_tiles(7));
    bg_left.set_visible(true);
    bg_left.set_bg_priority(0);
    bg_left.set_z_order(-1000);

    bn::sprite_ptr bg_center = bn::sprite_items::textbox.create_sprite(16, 16);
    bg_center.set_tiles(tiles.create_tiles(8));
    bg_center.set_visible(true);
    bg_center.set_bg_priority(0);
    bg_center.set_z_order(-1000);

    // This prevents menu from being instantly closed after being opened with
    // the same shortcut because of polling
    neo::utils::wait(100);

    while (!neo::buttons::is_pressed("Start"))
    {
      bn::core::update();
    }

    bg_top_left.set_visible(false);
    bg_down_left.set_visible(false);
    bg_top_right.set_visible(false);
    bg_down_right.set_visible(false);
    bg_top.set_visible(false);
    bg_down.set_visible(false);
    bg_right.set_visible(false);
    bg_left.set_visible(false);
  }
}
