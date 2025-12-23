#ifndef NEO_MENU_H
#define NEO_MENU_H

#include <bn_core.h>
#include <bn_sprite_ptr.h>
#include <bn_vector.h>

#include <neo_types.h>

namespace neo
{
  class game;

  class menu
  {
    static constexpr int LINE_HEIGHT = 8;
    static constexpr int PADDING_LEFT = 12;
    static constexpr int PADDING_RIGHT = 8;
    static constexpr int PADDING_TOP = 8;
    static constexpr int PADDING_BOTTOM = 8;
    static constexpr int ARROW_PADDING = 8;
    static constexpr int MARGIN = 4;
    static constexpr int CHAR_WIDTH = 8;
    static constexpr int MAX_LENGTH = 25;
    static constexpr int MAX_ITEMS = 5;
    static constexpr int CORNER_SIZE = 16;
    static constexpr int BG_PRIORITY = 1;
    static constexpr int TEXT_PRIORITY = 0;
    static constexpr int MAX_SIDE_SLICES = 15;
    static constexpr int MAX_CENTER_SLICES = 150;

    public:
      menu(neo::game* game, const bn::vector<neo::types::menu_choice, MAX_ITEMS>& choices);

      int show();
      void set_direction(neo::types::direction direction_);
      void set_z_order(int z_order_);

      neo::game* game;
      bn::vector<neo::types::menu_choice, MAX_ITEMS> choices;
      neo::types::direction direction;
      int bg_z_order;
      int text_z_order;

    private:
      bn::sprite_ptr _create_slice(bn::sprite_tiles_ptr tiles, int x, int y);
      bn::vector<bn::sprite_ptr, 4> _create_corners(bn::sprite_tiles_item* tiles_item, int x, int y, int width, int height);
      bn::vector<bn::sprite_ptr, MAX_SIDE_SLICES> _create_side(bn::sprite_tiles_ptr tiles, int x, int y, int length, bool horizontal);
      bn::vector<bn::sprite_ptr, MAX_CENTER_SLICES> _create_center(bn::sprite_tiles_ptr tiles, int x, int y, int width, int height);
  };
}

#endif
