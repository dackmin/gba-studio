#ifndef NEO_SAVE_H
#define NEO_SAVE_H

#include <bn_core.h>
#include <bn_string_view.h>
#include <bn_type_traits.h>

namespace neo
{
  class game;
}

namespace neo::save
{
  struct saved_actor
  {
    char id[40] = {};
    char name[40] = {};
    int tile_x = 0;
    int tile_y = 0;
    int direction = 0;
    bool visible = true;
  };

  struct saved_variable
  {
    char name[40] = {};
    int int_value = 0;
    bool bool_value = false;
    char str_value[40] = {};
  };

  struct save_data
  {
    char format_tag[8] = "GBASAV1";
    char scene_id[40] = {};
    bool has_player = false;
    int player_pixel_x = 0;
    int player_pixel_y = 0;
    int player_tile_x = 0;
    int player_tile_y = 0;
    int player_direction = 0;
    int actors_count = 0;
    saved_actor actors[20] = {};
    int variables_count = 0;
    saved_variable variables[64] = {};
  };

  static_assert(bn::is_trivially_copyable<save_data>(), "save_data must be trivially copyable for SRAM");

  bool has_save();
  bool has_pending_load();
  const save_data& get_pending_save_data();
  void clear_pending_load();

  void write(neo::game* game);
  bool load(neo::game* game);
  void apply_loaded_state_to_scene(neo::game* game);
}

#endif
