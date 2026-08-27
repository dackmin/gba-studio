#include <bn_core.h>
#include <bn_sprite_ptr.h>
#include <bn_sprite_item.h>
#include <bn_vector.h>

#include <neo_types.h>

#include "game.h"
#include "dialog_bg.h"

namespace neo
{
  dialog_bg::dialog_bg (neo::game* game_, const bn::sprite_item* sprite_, int x_, int y_, int width_, int height_):
    game(game_),
    sprite(sprite_),
    x(x_),
    y(y_),
    width(width_),
    height(height_),
    padding_left(12),
    padding_right(8),
    padding_top(8),
    padding_bottom(8),
    margin_left(4),
    margin_right(4),
    margin_top(4),
    margin_bottom(4),
    bg_priority(0),
    z_order(1),
    visible(true),
    _corner_width(0),
    _corner_height(0)
  {
    bn::sprite_tiles_item tiles = sprite->tiles_item();

    _create_corners(
      corners,
      &tiles,
      x,
      y,
      width,
      height
    );

    bn::sprite_ptr corner = corners.at(0);
    _corner_width = corner.dimensions().width();
    _corner_height = corner.dimensions().height();

    bn::fixed top_count = bn::fixed(width - _corner_width * 2) / bn::fixed(_corner_width);
    _create_side(
      bg_top,
      tiles.create_tiles(4),
      x + _corner_width,
      y,
      top_count.ceil_integer(),
      true
    );

    bn::fixed bottom_count = bn::fixed(width - _corner_width * 2) / bn::fixed(_corner_width);
    _create_side(
      bg_bottom,
      tiles.create_tiles(5),
      x + _corner_width,
      y + height - _corner_height,
      bottom_count.ceil_integer(),
      true
    );

    bn::fixed left_count = bn::fixed(height - _corner_height * 2) / bn::fixed(_corner_height);
    _create_side(
      bg_left,
      tiles.create_tiles(7),
      x,
      y + _corner_height,
      left_count.ceil_integer(),
      false
    );

    bn::fixed right_count = bn::fixed(height - _corner_height * 2) / bn::fixed(_corner_height);
    _create_side(
      bg_right,
      tiles.create_tiles(6),
      x + width - _corner_width,
      y + _corner_height,
      right_count.ceil_integer(),
      false
    );

    _create_center(
      bg_center,
      tiles.create_tiles(8),
      x + _corner_width,
      y + _corner_height,
      width - _corner_width * 2,
      height - _corner_height * 2
    );
  }

  void dialog_bg::set_bg_priority (int priority)
  {
    bg_priority = priority;

    for (bn::sprite_ptr& corner : corners)
    {
      corner.set_bg_priority(bg_priority);
    }

    for (bn::sprite_ptr& slice : bg_top)
    {
      slice.set_bg_priority(bg_priority);
    }

    for (bn::sprite_ptr& slice : bg_bottom)
    {
      slice.set_bg_priority(bg_priority);
    }

    for (bn::sprite_ptr& slice : bg_left)
    {
      slice.set_bg_priority(bg_priority);
    }

    for (bn::sprite_ptr& slice : bg_right)
    {
      slice.set_bg_priority(bg_priority);
    }

    for (bn::sprite_ptr& slice : bg_center)
    {
      slice.set_bg_priority(bg_priority);
    }
  }

  void dialog_bg::set_z_order (int z_order_)
  {
    z_order = z_order_;

    for (bn::sprite_ptr& corner : corners)
    {
      corner.set_z_order(z_order);
    }

    for (bn::sprite_ptr& slice : bg_top)
    {
      slice.set_z_order(z_order);
    }

    for (bn::sprite_ptr& slice : bg_bottom)
    {
      slice.set_z_order(z_order);
    }

    for (bn::sprite_ptr& slice : bg_left)
    {
      slice.set_z_order(z_order);
    }

    for (bn::sprite_ptr& slice : bg_right)
    {
      slice.set_z_order(z_order);
    }

    for (bn::sprite_ptr& slice : bg_center)
    {
      slice.set_z_order(z_order);
    }
  }

  void dialog_bg::set_visible (bool visible_)
  {
    visible = visible_;

    for (bn::sprite_ptr& corner : corners)
    {
      corner.set_visible(visible);
    }

    for (bn::sprite_ptr& slice : bg_top)
    {
      slice.set_visible(visible);
    }

    for (bn::sprite_ptr& slice : bg_bottom)
    {
      slice.set_visible(visible);
    }

    for (bn::sprite_ptr& slice : bg_left)
    {
      slice.set_visible(visible);
    }

    for (bn::sprite_ptr& slice : bg_right)
    {
      slice.set_visible(visible);
    }

    for (bn::sprite_ptr& slice : bg_center)
    {
      slice.set_visible(visible);
    }
  }

  void dialog_bg::set_position (int x_, int y_)
  {
    x = x_;
    y = y_;

    for (bn::sprite_ptr& corner : corners)
    {
      corner.set_top_left_position(
        x + (corner.x() - x),
        y + (corner.y() - y)
      );
    }

    for (bn::sprite_ptr& slice : bg_top)
    {
      slice.set_top_left_position(
        x + (slice.x() - x),
        y + (slice.y() - y)
      );
    }

    for (bn::sprite_ptr& slice : bg_bottom)
    {
      slice.set_top_left_position(
        x + (slice.x() - x),
        y + (slice.y() - y)
      );
    }

    for (bn::sprite_ptr& slice : bg_left)
    {
      slice.set_top_left_position(
        x + (slice.x() - x),
        y + (slice.y() - y)
      );
    }

    for (bn::sprite_ptr& slice : bg_right)
    {
      slice.set_top_left_position(
        x + (slice.x() - x),
        y + (slice.y() - y)
      );
    }

    for (bn::sprite_ptr& slice : bg_center)
    {
      slice.set_top_left_position(
        x + (slice.x() - x),
        y + (slice.y() - y)
      );
    }
  }

  bn::sprite_ptr dialog_bg::_create_slice (bn::sprite_tiles_ptr tiles, int x_, int y_)
  {
    bn::sprite_ptr slice = sprite->create_sprite(0, 0);
    slice.set_tiles(tiles);
    slice.set_visible(visible);
    slice.set_bg_priority(bg_priority);
    slice.set_z_order(z_order);
    slice.set_top_left_position(x_, y_);

    return slice;
  }
  
  void dialog_bg::_create_corners (bn::vector<bn::sprite_ptr, 4>& out, bn::sprite_tiles_item* tiles_item, int x_, int y_, int width_, int height_)
  {
    bn::sprite_ptr bg_top_left = _create_slice(
      tiles_item->create_tiles(0),
      x_,
      y_
    );
    out.push_back(bg_top_left);

    bn::sprite_ptr bg_down_left = _create_slice(
      tiles_item->create_tiles(1),
      x_,
      y_ + height_ - bg_top_left.dimensions().height()
    );
    out.push_back(bg_down_left);

    bn::sprite_ptr bg_top_right = _create_slice(
      tiles_item->create_tiles(2),
      x_ + width_ - bg_top_left.dimensions().width(),
      y_
    );
    out.push_back(bg_top_right);

    bn::sprite_ptr bg_down_right = _create_slice(
      tiles_item->create_tiles(3),
      x_ + width_ - bg_top_left.dimensions().width(),
      y_ + height_ - bg_top_left.dimensions().height()
    );
    out.push_back(bg_down_right);
  }

  void dialog_bg::_create_side (bn::vector<bn::sprite_ptr, dialog_bg::MAX_SIDE_SLICES>& out, bn::sprite_tiles_ptr tiles, int x_, int y_, int length, bool horizontal)
  {
    for (int i = 0; i < length && i < MAX_SIDE_SLICES; i++)
    {
      bn::sprite_ptr slice = _create_slice(
        tiles,
        horizontal ? x_ + (i * _corner_width) : x_,
        horizontal ? y_ : y_ + (i * _corner_height)
      );

      out.push_back(slice);
    }
  }

  void dialog_bg::_create_center (bn::vector<bn::sprite_ptr, dialog_bg::MAX_CENTER_SLICES>& out, bn::sprite_tiles_ptr tiles, int x_, int y_, int width_, int height_)
  {
    bn::fixed horizontal_count = bn::fixed(width_) / bn::fixed(_corner_width);
    bn::fixed vertical_count = bn::fixed(height_) / bn::fixed(_corner_height);

    for (int j = 0; j < vertical_count.ceil_integer() && j < MAX_SIDE_SLICES; j++)
    {
      for (int i = 0; i < horizontal_count.ceil_integer() && i < MAX_SIDE_SLICES; i++)
      {
        bn::sprite_ptr slice = _create_slice(
          tiles,
          x_ + (i * _corner_width),
          y_ + (j * _corner_height)
        );

        out.push_back(slice);
      }
    }
  }
}
