#ifndef NEO_MENU_H
#define NEO_MENU_H

#include <bn_core.h>
#include <bn_vector.h>

#include <neo_types.h>
#include <neo_settings.h>

namespace neo
{
  class game;

  class menu
  {
    static constexpr int CHAR_WIDTH = 8;
    static constexpr int MAX_LENGTH = 25;
    static constexpr int MAX_ITEMS = 5;
    static constexpr int BG_PRIORITY = 1;
    static constexpr int TEXT_PRIORITY = 0;
    static constexpr int MAX_SIDE_SLICES = 15;
    static constexpr int MAX_CENTER_SLICES = 150;

    public:
      menu(neo::game* game, const bn::vector<neo::types::menu_choice, MAX_ITEMS>& choices);

      int show();
      void set_direction(neo::types::direction direction_);
      void set_z_order(int z_order_);
      void set_font(const bn::sprite_item* font_);
      void set_textbox(const bn::sprite_item* textbox_);

      neo::game* game;
      bn::vector<neo::types::menu_choice, MAX_ITEMS> choices;
      neo::types::direction direction;
      const bn::sprite_item* font = nullptr;
      const bn::sprite_item* textbox = nullptr;
      int bg_z_order;
      int text_z_order;
  };
}

#endif
