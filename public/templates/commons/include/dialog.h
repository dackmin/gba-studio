#ifndef NEO_DIALOG_H
#define NEO_DIALOG_H

#include <bn_core.h>
#include <bn_regular_bg_ptr.h>
#include <bn_sprite_ptr.h>
#include <bn_vector.h>

namespace neo
{
  class game;

  class dialog
  {
    static constexpr int LINE_HEIGHT = 8;
    static constexpr int MAX_LENGTH = 27;
    static constexpr int MAX_LINES = 5;
    static constexpr int CHAR_WIDTH = 8;
    static constexpr int PADDING_LEFT = 8;
    static constexpr int PADDING_RIGHT = 8;
    static constexpr int PADDING_TOP = 8;
    static constexpr int PADDING_BOTTOM = 8;
    static constexpr int MARGIN = 4;

    public:
      dialog(neo::game* game, const bn::vector<bn::string_view, MAX_LINES>& lines);

      void show();
      void set_direction(neo::types::direction direction_);
      void set_z_order(int z_order_);

      neo::game* game;
      bn::vector<bn::string_view, MAX_LINES> lines;
      neo::types::direction direction;
      int lines_count;
      int bg_z_order;
      int text_z_order;
  };
}

#endif
