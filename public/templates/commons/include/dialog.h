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
    static constexpr int PADDING = 8;
    static constexpr int MAX_LENGTH = 27;
    static constexpr int MAX_LINES = 5;

    public:
      dialog(neo::game* game, bn::string_view text);

      void show(bn::string_view text);
      void hide();
      bn::regular_bg_item get_background(int lines_count);

      neo::game* game;
      bn::string_view text;
      neo::types::direction direction;

      bn::regular_bg_item bg_2_lines;
      bn::regular_bg_item bg_3_lines;
  };
}

#endif
