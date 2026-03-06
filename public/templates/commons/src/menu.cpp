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
#include "dialog_bg.h"

namespace neo
{
  menu::menu (neo::game* game_, const bn::vector<neo::types::menu_choice, MAX_ITEMS>& choices_):
    game(game_),
    choices(choices_),
    direction(neo::types::direction::DOWN_RIGHT),
    bg_z_order(0),
    text_z_order(1)
  {}

  int menu::show ()
  {
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
    neo::dialog_bg bg = dialog_bg(
      game,
      &bn::sprite_items::textbox,
      x,
      y,
      total_width,
      total_height
    );
    bg.set_z_order(bg_z_order);

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

    bg.set_visible(false);
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
