#include <neo_logs.h>

#include <bn_core.h>
#include <bn_log.h>
#include <bn_display.h>
#include <bn_sstream.h>
#include <bn_sprite_item.h>
#include <bn_sprite_ptr.h>
#include <bn_sprite_text_generator.h>
#include <bn_sprite_palette_ptr.h>
#include <bn_unique_ptr.h>

#include <bn_sprite_items_textbox.h>
#include <bn_sprite_items_menu_arrow.h>

#include <neo_types.h>
#include <neo_settings.h>

#include "menu.h"
#include "game.h"
#include "buttons.h"
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
    const bn::sprite_item& font_item = font != nullptr
      ? *font : neo::settings::default_font;
    const bn::sprite_item& textbox_item = textbox != nullptr
      ? *textbox : neo::settings::default_menu_textbox;
    int line_height = font_item.shape_size().height();
    int longest = 0;
    for (int i = 0; i < choices.size(); ++i)
    {
      if (choices.at(i).text.size() > longest)
      {
        longest = choices.at(i).text.size();
      }
    }

    int total_width = CHAR_WIDTH * longest +
      neo::settings::MENU_PADDING_LEFT + neo::settings::MENU_PADDING_RIGHT;
    int total_height = line_height * choices.size() +
      neo::settings::MENU_PADDING_TOP + neo::settings::MENU_PADDING_BOTTOM;

    int x = 0;
    int y = 0;

    switch (direction)
    {
      case neo::types::direction::UP_LEFT:
        x = neo::settings::MENU_MARGIN_LEFT;
        y = neo::settings::MENU_MARGIN_TOP;
        break;

      case neo::types::direction::UP_RIGHT:
        x = bn::display::width() - total_width - neo::settings::MENU_MARGIN_RIGHT;
        y = neo::settings::MENU_MARGIN_TOP;
        break;

      case neo::types::direction::DOWN_LEFT:
        x = neo::settings::MENU_MARGIN_LEFT;
        y = bn::display::height() - total_height - neo::settings::MENU_MARGIN_BOTTOM;
        break;

      case neo::types::direction::DOWN_RIGHT:
        x = bn::display::width() - total_width - neo::settings::MENU_MARGIN_RIGHT;
        y = bn::display::height() - total_height - neo::settings::MENU_MARGIN_BOTTOM;
        break;

      default:
        break;
    }

    BN_LOG("Drawing menu with ", choices.size(), " choices (", total_width, "x", total_height, ")");

    // Draw bg
    // dialog_bg and text_sprites hold ~340 sprite_ptr slots combined: too large for IWRAM,
    // whether on the stack or as static data, so both are heap-allocated (Butano's heap lives
    // in the much larger EWRAM) and freed automatically when they go out of scope below
    bn::unique_ptr<neo::dialog_bg> bg_storage = bn::make_unique<neo::dialog_bg>(
      game,
      &textbox_item,
      x,
      y,
      total_width,
      total_height
    );
    neo::dialog_bg& bg = *bg_storage;
    bg.set_z_order(bg_z_order);

    // Create font
    bn::unique_ptr<bn::vector<bn::sprite_ptr, MAX_ITEMS * MAX_LENGTH>> text_sprites_storage =
      bn::make_unique<bn::vector<bn::sprite_ptr, MAX_ITEMS * MAX_LENGTH>>();
    bn::vector<bn::sprite_ptr, MAX_ITEMS * MAX_LENGTH>& text_sprites = *text_sprites_storage;
    bn::sprite_font sprite_font = bn::sprite_font(font_item);
    bn::sprite_text_generator text_generator(sprite_font);
    text_generator.set_left_alignment();
    text_generator.set_bg_priority(TEXT_PRIORITY);
    text_generator.set_z_order(text_z_order);

    // Render each option
    for (int i = 0; i < choices.size(); ++i)
    {
      bn::string_view choice = choices.at(i).text;
      bn::fixed text_x = x + neo::settings::MENU_PADDING_LEFT + neo::settings::MENU_ARROW_GAP;
      bn::fixed text_y = y + neo::settings::MENU_PADDING_TOP + (i * line_height);

      BN_LOG("Rendering menu choice: ", choice, " at position (", text_x, ",", text_y, ")");

      text_generator.generate_top_left(
        text_x,
        text_y,
        choice,
        text_sprites
      );
    }

    bn::sprite_palette_ptr palette = font_item.palette_item().create_new_palette();

    for (int c = 1; c < 16; ++c)
    {
      palette.set_color(c, neo::settings::TEXT_COLOR);
    }

    for (bn::sprite_ptr& sprite : text_sprites)
    {
      sprite.set_palette(palette);
    }

    int choice_index = 0;
    int selected_index = -1;

    // Draw arrow
    int arrow_x = x + neo::settings::MENU_PADDING_LEFT / 2;
    int arrow_y = y + neo::settings::MENU_PADDING_TOP + choice_index * line_height;
    bn::sprite_ptr arrow = bn::sprite_items::menu_arrow.create_sprite(0, 0);
    arrow.set_top_left_position(arrow_x, arrow_y);
    arrow.set_visible(true);
    arrow.set_bg_priority(TEXT_PRIORITY);
    arrow.set_z_order(text_z_order);
    arrow.set_palette(palette);

    // This prevents menu from being instantly closed after being opened with
    // the same shortcut because of polling
    game->wait(100);

    while (
      !neo::buttons::is_pressed("Start") &&
      !neo::buttons::is_pressed("B") &&
      selected_index == -1 &&
      !game->scene_changed
    )
    {
      if (neo::buttons::is_pressed("Up"))
      {
        if (choice_index > 0)
        {
          choice_index--;
          arrow.set_top_left_position(arrow_x,
            y + neo::settings::MENU_PADDING_TOP + choice_index * line_height);
          BN_LOG("Moved up inside menu to choice index: ", choice_index);
          game->update_frame();
        }
      }
      else if (neo::buttons::is_pressed("Down"))
      {
        if (choice_index < choices.size() - 1)
        {
          choice_index++;
          arrow.set_top_left_position(arrow_x,
            y + neo::settings::MENU_PADDING_TOP + choice_index * line_height);
          BN_LOG("Moved down inside menu to choice index: ", choice_index);
          game->update_frame();
        }
      }
      else if (neo::buttons::is_pressed("A"))
      {
        selected_index = choice_index;
        BN_LOG("Selected menu choice index: ", selected_index);
      }

      game->update_frame();
    }

    BN_LOG("Menu closed with selected index: ", selected_index);

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

  void menu::set_font (const bn::sprite_item* font_)
  {
    font = font_;
  }

  void menu::set_textbox (const bn::sprite_item* textbox_)
  {
    textbox = textbox_;
  }
}
