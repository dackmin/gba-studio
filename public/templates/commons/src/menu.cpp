#define BN_CFG_LOG_ENABLED true

#include <bn_core.h>
#include <bn_log.h>
#include <bn_display.h>
#include <bn_sstream.h>
#include <bn_sprite_item.h>
#include <bn_sprite_ptr.h>
#include <bn_sprite_text_generator.h>

#include <bn_sprite_items_textbox.h>
#include <bn_sprite_items_gbs_mono.h>

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
    direction(neo::types::direction::DOWN_RIGHT),
    bg_z_order(1),
    text_z_order(0),
    bg_top_left(bn::sprite_items::textbox.create_sprite(0, 0)),
    bg_down_left(bn::sprite_items::textbox.create_sprite(0, 32)),
    bg_top_right(bn::sprite_items::textbox.create_sprite(32, 0)),
    bg_down_right(bn::sprite_items::textbox.create_sprite(32, 32)),
    bg_top(bn::sprite_items::textbox.create_sprite(16, 0)),
    bg_down(bn::sprite_items::textbox.create_sprite(16, 32)),
    bg_left(bn::sprite_items::textbox.create_sprite(0, 16)),
    bg_right(bn::sprite_items::textbox.create_sprite(32, 16)),
    bg_center(bn::sprite_items::textbox.create_sprite(16, 16))
  {}

  void menu::show ()
  {
    bn::sprite_tiles_item tiles = bn::sprite_items::textbox.tiles_item();

    bg_top_left.set_tiles(tiles.create_tiles(0));
    bg_top_left.set_visible(true);
    bg_top_left.set_bg_priority(BG_PRIORITY);
    bg_top_left.set_z_order(bg_z_order);

    bg_down_left.set_tiles(tiles.create_tiles(1));
    bg_down_left.set_visible(true);
    bg_down_left.set_bg_priority(BG_PRIORITY);
    bg_down_left.set_z_order(bg_z_order);

    bg_top_right.set_tiles(tiles.create_tiles(2));
    bg_top_right.set_visible(true);
    bg_top_right.set_bg_priority(BG_PRIORITY);
    bg_top_right.set_z_order(bg_z_order);

    bg_down_right.set_tiles(tiles.create_tiles(3));
    bg_down_right.set_visible(true);
    bg_down_right.set_bg_priority(BG_PRIORITY);
    bg_down_right.set_z_order(bg_z_order);

    bg_top.set_tiles(tiles.create_tiles(4));
    bg_top.set_visible(true);
    bg_top.set_bg_priority(BG_PRIORITY);
    bg_top.set_z_order(bg_z_order);

    bg_down.set_tiles(tiles.create_tiles(5));
    bg_down.set_visible(true);
    bg_down.set_bg_priority(BG_PRIORITY);
    bg_down.set_z_order(bg_z_order);

    bg_right.set_tiles(tiles.create_tiles(6));
    bg_right.set_visible(true);
    bg_right.set_bg_priority(BG_PRIORITY);
    bg_right.set_z_order(bg_z_order);

    bg_left.set_tiles(tiles.create_tiles(7));
    bg_left.set_visible(true);
    bg_left.set_bg_priority(BG_PRIORITY);
    bg_left.set_z_order(bg_z_order);

    bg_center.set_tiles(tiles.create_tiles(8));
    bg_center.set_visible(true);
    bg_center.set_bg_priority(BG_PRIORITY);
    bg_center.set_z_order(bg_z_order);

    int longest = 0;
    for (int i = 0; i < choices.size(); ++i)
    {
      if (choices.at(i).text.size() > longest)
      {
        longest = choices.at(i).text.size();
      }
    }

    BN_LOG("Menu longest choice length: ", longest);
    int total_width = (CHAR_WIDTH * longest) + (PADDING * 2);
    int total_height = (LINE_HEIGHT * choices.size()) + (PADDING * 2);
    BN_LOG("Menu total size: ", total_width, "x", total_height);

    int x = 0;
    int y = 0;

    switch (direction)
    {
      case neo::types::direction::UP_LEFT:
        x = MARGIN;
        y = MARGIN;
        break;

      case neo::types::direction::UP_RIGHT:
        x = bn::display::width() - total_width - MARGIN;
        y = MARGIN;
        break;

      case neo::types::direction::DOWN_LEFT:
        x = MARGIN;
        y = bn::display::height() - total_height - MARGIN;
        break;

      case neo::types::direction::DOWN_RIGHT:
        x = bn::display::width() - total_width - MARGIN;
        y = bn::display::height() - total_height - MARGIN;
        break;

      default:
        break;
    }

    bn::vector<bn::sprite_ptr, MAX_ITEMS * MAX_LENGTH> text_sprites;

    // Create font
    bn::sprite_font font = bn::sprite_font(bn::sprite_items::gbs_mono);
    bn::sprite_text_generator text_generator(font);
    text_generator.set_left_alignment();
    text_generator.set_bg_priority(TEXT_PRIORITY);
    text_generator.set_z_order(text_z_order);

    // Render each option
    for (int i = 0; i < choices.size(); ++i)
    {
      bn::string_view choice = choices.at(i).text;
      bn::fixed text_x = x + PADDING;
      bn::fixed text_y = y + PADDING + (i * LINE_HEIGHT);

      text_generator.generate_top_left(
        text_x,
        text_y,
        choice,
        text_sprites
      );
    }
  
    bn::fixed vertical_scale = bn::fixed(total_height - CORNER_SIZE * 2) / bn::fixed(CORNER_SIZE);
    bn::fixed horizontal_scale = bn::fixed(total_width - CORNER_SIZE * 2) / bn::fixed(CORNER_SIZE);
    bn::fixed horizontal_shift = (CORNER_SIZE * horizontal_scale - CORNER_SIZE) / 2;
    bn::fixed vertical_shift = (CORNER_SIZE * vertical_scale - CORNER_SIZE) / 2;

    // Positions
    bg_top_left.set_top_left_position(x, y);
    bg_down_left.set_top_left_position(x, y + total_height - CORNER_SIZE);
    bg_top_right.set_top_left_position(x + total_width - CORNER_SIZE, y);
    bg_down_right.set_top_left_position(x + total_width - CORNER_SIZE, y + total_height - CORNER_SIZE);

    bg_top.set_top_left_position(x + CORNER_SIZE + horizontal_shift, y);
    bg_down.set_top_left_position(x + CORNER_SIZE + horizontal_shift, y + total_height - CORNER_SIZE);
    bg_left.set_top_left_position(x, y + CORNER_SIZE + vertical_shift);
    bg_right.set_top_left_position(x + total_width - CORNER_SIZE, y + CORNER_SIZE + vertical_shift);

    bg_center.set_top_left_position(x + CORNER_SIZE + horizontal_shift, y + CORNER_SIZE + vertical_shift);

    // Sizes
    bg_left.set_vertical_scale(vertical_scale);
    bg_right.set_vertical_scale(vertical_scale);
    bg_top.set_horizontal_scale(horizontal_scale);
    bg_down.set_horizontal_scale(horizontal_scale);
    bg_center.set_scale(
      horizontal_scale,
      vertical_scale
    );

    // This prevents menu from being instantly closed after being opened with
    // the same shortcut because of polling
    neo::utils::wait(100);

    while (!neo::buttons::is_pressed("Start"))
    {
      bn::core::update();
    }

    text_sprites.clear();
    bg_top_left.set_visible(false);
    bg_down_left.set_visible(false);
    bg_top_right.set_visible(false);
    bg_down_right.set_visible(false);
    bg_top.set_visible(false);
    bg_down.set_visible(false);
    bg_right.set_visible(false);
    bg_left.set_visible(false);
    bg_center.set_visible(false);
  }

  void menu::set_direction (neo::types::direction direction_)
  {
    direction = direction_;
  }

  void menu::set_z_order (int z_order_)
  {
    bg_z_order = z_order_;
    text_z_order = z_order_ - 1;
  }
}
