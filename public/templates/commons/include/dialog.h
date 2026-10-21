#ifndef NEO_DIALOG_H
#define NEO_DIALOG_H

#include <bn_core.h>
#include <bn_regular_bg_ptr.h>
#include <bn_sprite_ptr.h>
#include <bn_vector.h>

#include <neo_types.h>
#include <neo_settings.h>

namespace neo
{
  class game;

  class dialog
  {
    static constexpr int MAX_LENGTH = 27;
    static constexpr int MAX_LINES = 5;
    static constexpr int CHAR_WIDTH = 8;

    public:
      dialog(neo::game* game, const bn::vector<bn::string_view, MAX_LINES>& lines);

      void show();
      void set_direction(neo::types::direction direction_);
      void set_z_order(int z_order_);
      void set_speed(neo::types::text_speed speed_);
      void set_portrait(const bn::sprite_item* portrait_, neo::types::dialog_portrait_position position_);
      void set_font(const bn::sprite_item* font_);
      void set_textbox(const bn::sprite_item* textbox_);
      void set_text_color(const bn::color* text_color_);

      neo::game* game;
      bn::vector<bn::string_view, MAX_LINES> lines;
      neo::types::direction direction;
      neo::types::text_speed speed;
      const bn::sprite_item* portrait = nullptr;
      neo::types::dialog_portrait_position portrait_position = neo::types::dialog_portrait_position::LEFT;
      const bn::sprite_item* font = nullptr;
      const bn::color* text_color = nullptr;
      const bn::sprite_item* textbox = nullptr;
      int lines_count;
      int bg_z_order;
      int text_z_order;
  };
}

#endif
