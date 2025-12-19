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
    static constexpr int MAX_LENGTH = 25;
    static constexpr int MAX_ITEMS = 5;

    public:
      menu(neo::game* game, const bn::vector<neo::types::menu_choice, MAX_ITEMS>& choices);

      void show();

      neo::game* game;
      bn::vector<neo::types::menu_choice, MAX_ITEMS> choices;
      neo::types::direction direction;

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
