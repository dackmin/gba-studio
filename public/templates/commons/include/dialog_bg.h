#ifndef NEO_DIALOG_BG_H
#define NEO_DIALOG_BG_H

#include <bn_core.h>
#include <bn_sprite_ptr.h>
#include <bn_vector.h>
#include <bn_sprite_item.h>

#include <neo_types.h>

namespace neo
{
  class game;

  class dialog_bg
  {
    static constexpr int MAX_SIDE_SLICES = 15;
    static constexpr int MAX_CENTER_SLICES = 150;

    public:
      dialog_bg(neo::game* game_, const bn::sprite_item* sprite_, int x_, int y_, int width_, int height_);

      neo::game* game;
      const bn::sprite_item* sprite;

      int x;
      int y;
      int width;
      int height;
      int padding_left;
      int padding_right;
      int padding_top;
      int padding_bottom;
      int margin_left;
      int margin_right;
      int margin_top;
      int margin_bottom;
      int bg_priority;
      int z_order;
      bool visible;

      bn::vector<bn::sprite_ptr, 4> corners;
      bn::vector<bn::sprite_ptr, 15> bg_top;
      bn::vector<bn::sprite_ptr, 15> bg_bottom;
      bn::vector<bn::sprite_ptr, 15> bg_left;
      bn::vector<bn::sprite_ptr, 15> bg_right;
      bn::vector<bn::sprite_ptr, 150> bg_center;

      void set_bg_priority(int priority);
      void set_z_order(int z_order_);
      void set_visible(bool visible_);
      void set_position(int x_, int y_);

    private:
      int _corner_width;
      int _corner_height;

      bn::sprite_ptr _create_slice(bn::sprite_tiles_ptr tiles, int x, int y);
      bn::vector<bn::sprite_ptr, 4> _create_corners(bn::sprite_tiles_item* tiles_item, int x, int y, int width, int height);
      bn::vector<bn::sprite_ptr, MAX_SIDE_SLICES> _create_side(bn::sprite_tiles_ptr tiles, int x, int y, int length, bool horizontal);
      bn::vector<bn::sprite_ptr, MAX_CENTER_SLICES> _create_center(bn::sprite_tiles_ptr tiles, int x, int y, int width, int height);
  };
}

#endif
