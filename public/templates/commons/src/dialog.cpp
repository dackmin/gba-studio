#define BN_CFG_LOG_ENABLED true

#include <bn_core.h>
#include <bn_log.h>
#include <bn_sstream.h>
#include <bn_display.h>
#include <bn_sprite_item.h>
#include <bn_sprite_text_generator.h>

#include <bn_sprite_items_textbox.h>
#include <bn_sprite_items_gbs_mono.h>

#include <neo_types.h>

#include "dialog.h"
#include "dialog_bg.h"
#include "game.h"
#include "buttons.h"
#include "utils.h"

namespace neo
{
  dialog::dialog (neo::game* game_, const bn::vector<bn::string_view, MAX_LINES>& lines_):
    game(game_),
    lines(lines_),
    direction(neo::types::direction::DOWN),
    lines_count(lines_.size()),
    bg_z_order(0),
    text_z_order(1)
  {}

  void dialog::show ()
  {
    int total_width = bn::display::width() - MARGIN * 2;
    int total_height = LINE_HEIGHT * lines_count + PADDING_TOP + PADDING_BOTTOM;
    int x = 0;
    int y = 0;

    switch (direction)
    {
      case neo::types::direction::UP:
        x = MARGIN;
        y = MARGIN;
        break;

      case neo::types::direction::DOWN:
        x = MARGIN;
        y = bn::display::height() - total_height - MARGIN;
        break;

      default:
        break;
    }

    neo::dialog_bg bg = dialog_bg(
      game,
      &bn::sprite_items::textbox,
      x,
      y,
      total_width,
      total_height
    );

    // Create font
    bn::vector<bn::sprite_ptr, MAX_LINES * MAX_LENGTH> text_sprites;
    bn::sprite_font font = bn::sprite_font(bn::sprite_items::gbs_mono);
    bn::sprite_text_generator text_generator(font);
    text_generator.set_left_alignment();
    text_generator.set_bg_priority(0);
    text_generator.set_z_order(text_z_order);

    // Render each line
    for (int i = 0; i < lines_count; ++i)
    {
      bn::string_view line = lines.at(i);
      bn::fixed text_x = x + PADDING_LEFT;
      bn::fixed text_y = y + PADDING_TOP + (i * LINE_HEIGHT);

      text_generator.generate_top_left(
        text_x,
        text_y,
        line,
        text_sprites
      );
    }

    // Hide the sprites first
    for (bn::sprite_ptr& sprite : text_sprites)
    {
      sprite.set_visible(false);
    }

    // Then make them appear one by one
    for (bn::sprite_ptr& sprite : text_sprites)
    {
      sprite.set_visible(true);

      neo::utils::wait(16); // 1 frame at 60 FPS
      bn::core::update();
    }

    while (!neo::buttons::is_pressed("A"))
    {
      bn::core::update();
    }

    // Hide dialog
    text_sprites.clear();
    bg.set_visible(false);
  }

  void dialog::set_direction (neo::types::direction direction_)
  {
    direction = direction_;
  }

  void dialog::set_z_order (int z_order_)
  {
    bg_z_order = z_order_;
    text_z_order = z_order_ - 1;
  }
}
