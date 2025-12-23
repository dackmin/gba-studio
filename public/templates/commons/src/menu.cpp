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
#include <bn_sprite_items_menu_arrow.h>

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
    text_z_order(0)
  {}

  bn::sprite_ptr menu::_create_slice (bn::sprite_tiles_ptr tiles, int x, int y)
  {
    bn::sprite_ptr slice = bn::sprite_items::textbox.create_sprite(0, 0);
    slice.set_tiles(tiles);
    slice.set_visible(true);
    slice.set_bg_priority(BG_PRIORITY);
    slice.set_z_order(bg_z_order);
    slice.set_top_left_position(x, y);

    return slice;
  }

  bn::vector<bn::sprite_ptr, 4> menu::_create_corners (bn::sprite_tiles_item* tiles_item, int x, int y, int width, int height)
  {
    bn::vector<bn::sprite_ptr, 4> corners;

    bn::sprite_ptr bg_top_left = _create_slice(
      tiles_item->create_tiles(0),
      x,
      y
    );
    corners.push_back(bg_top_left);

    bn::sprite_ptr bg_down_left = _create_slice(
      tiles_item->create_tiles(1),
      x,
      y + height - CORNER_SIZE
    );
    corners.push_back(bg_down_left);

    bn::sprite_ptr bg_top_right = _create_slice(
      tiles_item->create_tiles(2),
      x + width - CORNER_SIZE,
      y
    );
    corners.push_back(bg_top_right);

    bn::sprite_ptr bg_down_right = _create_slice(
      tiles_item->create_tiles(3),
      x + width - CORNER_SIZE,
      y + height - CORNER_SIZE
    );
    corners.push_back(bg_down_right);

    return corners;
  }

  bn::vector<bn::sprite_ptr, menu::MAX_SIDE_SLICES> menu::_create_side (bn::sprite_tiles_ptr tiles, int x, int y, int length, bool horizontal)
  {
    bn::vector<bn::sprite_ptr, MAX_SIDE_SLICES> slices;

    for (int i = 0; i < length && i < MAX_SIDE_SLICES; i++)
    {
      bn::sprite_ptr slice = _create_slice(
        tiles,
        horizontal ? x + (i * CORNER_SIZE) : x,
        horizontal ? y : y + (i * CORNER_SIZE)
      );

      slices.push_back(slice);
    }

    return slices;
  }

  bn::vector<bn::sprite_ptr, menu::MAX_CENTER_SLICES> menu::_create_center (bn::sprite_tiles_ptr tiles, int x, int y, int width, int height)
  {
    bn::vector<bn::sprite_ptr, MAX_CENTER_SLICES> slices;

    bn::fixed horizontal_count = bn::fixed(width) / bn::fixed(CORNER_SIZE);
    bn::fixed vertical_count = bn::fixed(height) / bn::fixed(CORNER_SIZE);

    for (int j = 0; j < vertical_count.ceil_integer() && j < MAX_SIDE_SLICES; j++)
    {
      for (int i = 0; i < horizontal_count.ceil_integer() && i < MAX_SIDE_SLICES; i++)
      {
        bn::sprite_ptr slice = _create_slice(
          tiles,
          x + (i * CORNER_SIZE),
          y + (j * CORNER_SIZE)
        );

        slices.push_back(slice);
      }
    }

    return slices;
  }

  int menu::show ()
  {
    bn::sprite_tiles_item tiles = bn::sprite_items::textbox.tiles_item();

    int longest = 0;
    for (int i = 0; i < choices.size(); ++i)
    {
      if (choices.at(i).text.size() > longest)
      {
        longest = choices.at(i).text.size();
      }
    }

    int total_width = CHAR_WIDTH * longest + PADDING_LEFT + PADDING_RIGHT;
    int total_height = LINE_HEIGHT * choices.size() + PADDING_TOP + PADDING_BOTTOM;

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

    // Draw bg
    bn::vector<bn::sprite_ptr, 4> corners = _create_corners(
      &tiles,
      x,
      y,
      total_width,
      total_height
    );

    bn::fixed top_count = bn::fixed(total_width - CORNER_SIZE * 2) / bn::fixed(CORNER_SIZE);
    bn::vector<bn::sprite_ptr, MAX_SIDE_SLICES> bg_top = _create_side(
      tiles.create_tiles(4),
      x + CORNER_SIZE,
      y,
      top_count.ceil_integer(),
      true
    );

    bn::fixed bottom_count = bn::fixed(total_width - CORNER_SIZE * 2) / bn::fixed(CORNER_SIZE);
    bn::vector<bn::sprite_ptr, MAX_SIDE_SLICES> bg_bottom = _create_side(
      tiles.create_tiles(5),
      x + CORNER_SIZE,
      y + total_height - CORNER_SIZE,
      bottom_count.ceil_integer(),
      true
    );

    bn::fixed left_count = bn::fixed(total_height - CORNER_SIZE * 2) / bn::fixed(CORNER_SIZE);
    bn::vector<bn::sprite_ptr, MAX_SIDE_SLICES> bg_left = _create_side(
      tiles.create_tiles(7),
      x,
      y + CORNER_SIZE,
      left_count.ceil_integer(),
      false
    );

    bn::fixed right_count = bn::fixed(total_height - CORNER_SIZE * 2) / bn::fixed(CORNER_SIZE);
    bn::vector<bn::sprite_ptr, MAX_SIDE_SLICES> bg_right = _create_side(
      tiles.create_tiles(6),
      x + total_width - CORNER_SIZE,
      y + CORNER_SIZE,
      right_count.ceil_integer(),
      false
    );

    bn::vector<bn::sprite_ptr, MAX_CENTER_SLICES> bg_center = _create_center(
      tiles.create_tiles(8),
      x + CORNER_SIZE,
      y + CORNER_SIZE,
      total_width - CORNER_SIZE * 2,
      total_height - CORNER_SIZE * 2
    );

    // Create font
    bn::vector<bn::sprite_ptr, MAX_ITEMS * MAX_LENGTH> text_sprites;
    bn::sprite_font font = bn::sprite_font(bn::sprite_items::gbs_mono);
    bn::sprite_text_generator text_generator(font);
    text_generator.set_left_alignment();
    text_generator.set_bg_priority(TEXT_PRIORITY);
    text_generator.set_z_order(text_z_order);

    // Render each option
    for (int i = 0; i < choices.size(); ++i)
    {
      bn::string_view choice = choices.at(i).text;
      bn::fixed text_x = x + PADDING_LEFT;
      bn::fixed text_y = y + PADDING_TOP + (i * LINE_HEIGHT);

      text_generator.generate_top_left(
        text_x,
        text_y,
        choice,
        text_sprites
      );
    }

    int choice_index = 0;
    int selected_index = -1;

    // Draw arrow
    int arrow_x = x + ARROW_PADDING / 2;
    int arrow_y = y + PADDING_TOP + choice_index * LINE_HEIGHT;
    bn::sprite_ptr arrow = bn::sprite_items::menu_arrow.create_sprite(0, 0);
    arrow.set_top_left_position(arrow_x, arrow_y);
    arrow.set_visible(true);
    arrow.set_bg_priority(TEXT_PRIORITY);
    arrow.set_z_order(text_z_order);

    // This prevents menu from being instantly closed after being opened with
    // the same shortcut because of polling
    neo::utils::wait(100);

    while (!neo::buttons::is_pressed("Start") && !neo::buttons::is_pressed("B") && selected_index == -1)
    {
      if (neo::buttons::is_pressed("Up"))
      {
        if (choice_index > 0)
        {
          choice_index--;
          arrow.set_top_left_position(arrow_x, y + PADDING_TOP + choice_index * LINE_HEIGHT);
          bn::core::update();
        }
      }
      else if (neo::buttons::is_pressed("Down"))
      {
        if (choice_index < choices.size() - 1)
        {
          choice_index++;
          arrow.set_top_left_position(arrow_x, y + PADDING_TOP + choice_index * LINE_HEIGHT);
          bn::core::update();
        }
      }
      else if (neo::buttons::is_pressed("A"))
      {
        selected_index = choice_index;
      }

      bn::core::update();
    }

    text_sprites.clear();

    for (bn::sprite_ptr& corner : corners)
    {
      corner.set_visible(false);
    }

    for (bn::sprite_ptr& slice : bg_top)
    {
      slice.set_visible(false);
    }

    for (bn::sprite_ptr& slice : bg_bottom)
    {
      slice.set_visible(false);
    }

    for (bn::sprite_ptr& slice : bg_left)
    {
      slice.set_visible(false);
    }

    arrow.set_visible(false);

    return selected_index;
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
