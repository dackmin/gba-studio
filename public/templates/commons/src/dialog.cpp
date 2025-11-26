#define BN_CFG_LOG_ENABLED true

#include <bn_core.h>
#include <bn_log.h>
#include <bn_sstream.h>
#include <bn_display.h>
#include <bn_sprite_item.h>
#include <bn_sprite_text_generator.h>

#include <bn_regular_bg_items_textbox_2l.h>
#include <bn_regular_bg_items_textbox_3l.h>
#include <bn_sprite_items_gbs_mono.h>

#include <neo_types.h>

#include "dialog.h"
#include "game.h"
#include "buttons.h"
#include "utils.h"

namespace neo
{
  dialog::dialog (neo::game* game_, int lines_count_, bn::string_view* lines_):
    game(game_),
    lines_count(lines_count_),
    lines(lines_),
    direction(neo::types::direction::DOWN),
    bg_2_lines(bn::regular_bg_items::textbox_2l),
    bg_3_lines(bn::regular_bg_items::textbox_3l)
  {}

  bn::regular_bg_item dialog::get_background ()
  {
    if (lines_count >= 3) return bg_3_lines;

    return bg_2_lines;
  }

  void dialog::show ()
  {
    BN_LOG("Lines count: ", lines_count);
    bn::regular_bg_ptr bg = get_background().create_bg(0, 0);

    // Show the textbox background
    bg.set_visible(true);
    bg.set_priority(0);
    bg.set_top_left_position(
      (neo::types::SCREEN_WIDTH - bg.dimensions().width()) / 2,
      bn::display::height() - neo::dialog::PADDING * 2 - neo::dialog::LINE_HEIGHT * (lines_count + 1)
    );

    bn::vector<bn::sprite_ptr, neo::dialog::MAX_LINES * neo::dialog::MAX_LENGTH> text_sprites;

    // Create font
    bn::sprite_font font = bn::sprite_font(bn::sprite_items::gbs_mono);

    // Create text generator and render the text
    bn::sprite_text_generator text_generator(font);
    text_generator.set_left_alignment();
    text_generator.set_bg_priority(0);

    // Render each line
    for (int i = 0; i < lines_count; ++i)
    {
      bn::string_view line = lines[i];

      // Calculate text position
      bn::fixed text_x = bg.top_left_position().x() + neo::dialog::PADDING * 2 - (bn::display::width() / 2) + 2;
      bn::fixed text_y = bg.top_left_position().y() + neo::dialog::PADDING * 2 - (bn::display::height() / 2) - 2 + (i * neo::dialog::LINE_HEIGHT);

      // Generate the text sprites for each line
      text_generator.generate(
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
}
