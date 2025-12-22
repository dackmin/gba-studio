#ifndef NEO_MENU_H
#define NEO_MENU_H

#include <bn_core.h>
#include <bn_regular_bg_ptr.h>
#include <bn_sprite_ptr.h>
#include <bn_vector.h>

#include <neo_types.h>

namespace neo
{
  class game;

  class menu
  {
    static constexpr int LINE_HEIGHT = 8;
    static constexpr int PADDING = 8;
    static constexpr int MARGIN = 4;
    static constexpr int CHAR_WIDTH = 8;
    static constexpr int MAX_LENGTH = 25;
    static constexpr int MAX_ITEMS = 5;
    static constexpr int CORNER_SIZE = 16;
    static constexpr int BG_PRIORITY = 1;
    static constexpr int TEXT_PRIORITY = 0;

    public:
      menu(neo::game* game, const bn::vector<neo::types::menu_choice, MAX_ITEMS>& choices);

      void show();
      void set_direction(neo::types::direction direction_);
      void set_z_order(int z_order_);

      neo::game* game;
      bn::vector<neo::types::menu_choice, MAX_ITEMS> choices;
      neo::types::direction direction;
      int bg_z_order;
      int text_z_order;

      bn::sprite_ptr bg_top_left;
      bn::sprite_ptr bg_down_left;
      bn::sprite_ptr bg_top_right;
      bn::sprite_ptr bg_down_right;
      bn::sprite_ptr bg_top;
      bn::sprite_ptr bg_down;
      bn::sprite_ptr bg_left;
      bn::sprite_ptr bg_right;
      bn::sprite_ptr bg_center;
  };
}

#endif
