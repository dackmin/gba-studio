#include <neo_logs.h>

#include <bn_core.h>
#include <bn_log.h>
#include <bn_sstream.h>
#include <bn_display.h>
#include <bn_sprite_item.h>
#include <bn_sprite_text_generator.h>
#include <bn_sprite_palette_ptr.h>
#include <bn_unique_ptr.h>
#include <bn_optional.h>
#include <bn_algorithm.h>

#include <bn_sprite_items_textbox.h>

#include <neo_types.h>
#include <neo_settings.h>

#include "dialog.h"
#include "dialog_bg.h"
#include "game.h"
#include "buttons.h"

namespace neo
{
  dialog::dialog (neo::game* game_, const bn::vector<bn::string_view, MAX_LINES>& lines_):
    game(game_),
    lines(lines_),
    direction(neo::types::direction::DOWN),
    speed(neo::types::text_speed::NORMAL),
    lines_count(lines_.size()),
    bg_z_order(0),
    text_z_order(1)
  {}

  void dialog::set_font (const bn::sprite_item* font_)
  {
    font = font_;
  }

  void dialog::set_textbox (const bn::sprite_item* textbox_)
  {
    textbox = textbox_;
  }

  void dialog::show ()
  {
    BN_LOG("Showing dialog");

    const bn::sprite_item& font_item = font != nullptr
      ? *font : neo::settings::default_font;
    const bn::sprite_item& textbox_item = textbox != nullptr
      ? *textbox : neo::settings::default_textbox;

    int line_height = font_item.shape_size().height();
    int total_width = bn::display::width() - neo::settings::DIALOG_MARGIN_LEFT -
      neo::settings::DIALOG_MARGIN_RIGHT;
    int portrait_width = portrait != nullptr ? portrait->shape_size().width() : 0;
    int portrait_height = portrait != nullptr ? portrait->shape_size().height() : 0;
    bool portrait_left = portrait_position == neo::types::dialog_portrait_position::LEFT;
    int text_offset = portrait != nullptr && portrait_left
      ? portrait_width + neo::settings::DIALOG_PORTRAIT_GAP : 0;
    int total_height = bn::max(
      bn::max(
        line_height * lines_count,
        portrait_height
      ) + neo::settings::DIALOG_PADDING_TOP + neo::settings::DIALOG_PADDING_BOTTOM,
      line_height * 2 + 7 // 1 line + 2*8 padding, minimum height
    );
    int x = 0;
    int y = 0;

    switch (direction)
    {
      case neo::types::direction::UP:
        x = neo::settings::DIALOG_MARGIN_LEFT;
        y = neo::settings::DIALOG_MARGIN_TOP;
        break;

      case neo::types::direction::DOWN:
        x = neo::settings::DIALOG_MARGIN_LEFT;
        y = bn::display::height() - total_height - neo::settings::DIALOG_MARGIN_BOTTOM;
        break;

      default:
        break;
    }

    bn::unique_ptr<neo::dialog_bg> bg_storage = bn::make_unique<neo::dialog_bg>(
      game,
      &textbox_item,
      x,
      y,
      total_width,
      total_height
    );
    neo::dialog_bg& bg = *bg_storage;

    bn::optional<bn::sprite_ptr> portrait_sprite;

    if (portrait != nullptr)
    {
      portrait_sprite = portrait->create_sprite(0, 0);
      portrait_sprite->set_bg_priority(0);
      portrait_sprite->set_z_order(text_z_order);
      portrait_sprite->set_top_left_position(
        portrait_left
          ? x + neo::settings::DIALOG_PADDING_LEFT
          : x + total_width - neo::settings::DIALOG_PADDING_RIGHT - portrait_width,
        y + neo::settings::DIALOG_PADDING_TOP
      );
    }

    // Create font
    bn::unique_ptr<bn::vector<bn::sprite_ptr, MAX_LINES * MAX_LENGTH>> text_sprites_storage =
      bn::make_unique<bn::vector<bn::sprite_ptr, MAX_LINES * MAX_LENGTH>>();
    bn::vector<bn::sprite_ptr, MAX_LINES * MAX_LENGTH>& text_sprites = *text_sprites_storage;
    bn::sprite_font sprite_font = bn::sprite_font(font_item);
    bn::sprite_text_generator text_generator(sprite_font);
    text_generator.set_left_alignment();
    text_generator.set_bg_priority(0);
    text_generator.set_z_order(text_z_order);

    // Render each line
    for (int i = 0; i < lines_count; ++i)
    {
      bn::string_view line = lines.at(i);
      bn::fixed text_x = x + neo::settings::DIALOG_PADDING_LEFT + text_offset;
      bn::fixed text_y = y + neo::settings::DIALOG_PADDING_TOP + (i * line_height);

      text_generator.generate_top_left(
        text_x,
        text_y,
        line,
        text_sprites
      );
    }

    bn::sprite_palette_ptr palette = font_item.palette_item().create_new_palette();

    for (int c = 1; c < 16; ++c)
    {
      palette.set_color(c, neo::settings::TEXT_COLOR);
    }

    // Hide the sprites first
    for (bn::sprite_ptr& sprite : text_sprites)
    {
      sprite.set_visible(false);
      sprite.set_palette(palette);
    }

    // Then make them appear one by one
    int reveal_wait_ms = 48;
    switch (speed)
    {
      case neo::types::text_speed::SLOW:
        reveal_wait_ms = 96;
        break;

      case neo::types::text_speed::FAST:
        reveal_wait_ms = 16;
        break;

      default:
        break;
    }

    int reveal_wait_frames = reveal_wait_ms / 16;

    if (reveal_wait_frames < 1)
    {
      reveal_wait_frames = 1;
    }
    ++reveal_wait_frames;
    bool skipped = false;

    for (bn::sprite_ptr& sprite : text_sprites)
    {
      sprite.set_visible(true);

      for (int frame = 0; frame < reveal_wait_frames; ++frame)
      {
        game->update_frame();

        if (game->scene_changed)
        {
          break;
        }

        if (neo::buttons::is_pressed("A") || neo::buttons::is_pressed("B"))
        {
          skipped = true;
          break;
        }
      }

      if (skipped || game->scene_changed)
      {
        break;
      }
    }

    if (skipped)
    {
      for (bn::sprite_ptr& sprite : text_sprites)
      {
        sprite.set_visible(true);
      }

      game->update_frame();
    }

    while (!neo::buttons::is_pressed("A") && !game->scene_changed)
    {
      game->update_frame();
    }

    // Hide dialog
    BN_LOG("Hiding dialog");
    text_sprites.clear();
    portrait_sprite.reset();
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

  void dialog::set_speed (neo::types::text_speed speed_)
  {
    speed = speed_;
  }

  void dialog::set_portrait (const bn::sprite_item* portrait_, neo::types::dialog_portrait_position position_)
  {
    portrait = portrait_;
    portrait_position = position_;
  }
}
