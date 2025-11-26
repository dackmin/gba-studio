#ifndef NEO_TYPES_H
#define NEO_TYPES_H

#include <bn_core.h>
#include <bn_log.h>
#include <bn_regular_bg_ptr.h>
#include <bn_regular_bg_item.h>
#include <bn_sprite_item.h>
#include <bn_vector.h>

#include <neo_variables.h>

namespace neo::types
{
  static constexpr int SCREEN_WIDTH = 240;
  static constexpr int SCREEN_HEIGHT = 160;

  enum class direction
  {
    LEFT,
    RIGHT,
    UP,
    DOWN
  };

  struct event_value
  {
    bn::string_view type;
    neo::variables::value* value;

    event_value(bn::string_view type_, neo::variables::value* value_):
      type(type_), value(value_) {}

    inline int as_int(neo::variables::registry& variables)
    {
      if (type == "variable")
      {
        if (!variables.has(value->as_string()))
        {
          BN_LOG("Variable not found: ", value->as_string());
          return 0;
        }

        auto var_value = variables.get(value->as_string());
        return var_value.as_int();
      }
      else
      {
        return value->as_int();
      }
    }

    inline bool as_bool(neo::variables::registry& variables)
    {
      if (type == "variable")
      {
        if (!variables.has(value->as_string()))
        {
          BN_LOG("Variable not found: ", value->as_string());
          return false;
        }

        auto var_value = variables.get(value->as_string());
        return var_value.as_bool();
      }
      else
      {
        return value->as_bool();
      }
    }

    inline bn::string_view as_string(neo::variables::registry& variables)
    {
      if (type == "variable")
      {
        if (!variables.has(value->as_string()))
        {
          BN_LOG("Variable not found: ", value->as_string());
          return "";
        }

        auto var_value = variables.get(value->as_string());
        return var_value.as_string();
      }
      else
      {
        return value->as_string();
      }
    }
  };

  struct event
  {
    bn::string_view type;
  };

  struct wait_event: event
  {
    event_value* duration;
    wait_event(bn::string_view type_, event_value* duration_):
      event(type_), duration(duration_) {}
  };

  struct fade_event: event
  {
    event_value* duration;
    fade_event(bn::string_view type_, event_value* duration_):
      event(type_), duration(duration_) {}
  };

  struct scene_event: event
  {
    bn::string_view target;
    event_value* start_x;
    event_value* start_y;
    neo::types::direction start_direction;
    scene_event(bn::string_view type_, bn::string_view target_, event_value* start_x_, event_value* start_y_, neo::types::direction start_direction_):
      event(type_), target(target_), start_x(start_x_), start_y(start_y_), start_direction(start_direction_) {}
  };

  struct button_event: event
  {
    bool every;
    bn::vector<bn::string_view, 10> buttons;
    int events_count;
    event** events;

    button_event(
      bn::string_view type_,
      bool every_,
      bn::vector<bn::string_view, 10> buttons_,
      int events_count_,
      event** events_
    ): event(type_), every(every_), buttons(buttons_), events_count(events_count_), events(events_) {}

    // Helper constructor for single button
    button_event(bn::string_view type_, bn::string_view single_button, int events_count_, event** events_):
      event(type_), every(false), buttons(), events_count(events_count_), events(events_)
    {
      buttons.push_back(single_button);
    }
  };

  struct dialog_event: event
  {
    int lines_count;
    bn::string_view* lines;
    dialog_event(bn::string_view type_, int lines_count_, bn::string_view* lines_):
      event(type_), lines_count(lines_count_), lines(lines_) {}
  };

  struct set_variable_event: event
  {
    bn::string_view key;
    neo::variables::value* value;
    set_variable_event(bn::string_view type_, bn::string_view key_, neo::variables::value* value_):
      event(type_), key(key_), value(value_) {}
  };

  struct if_expression
  {
    bn::string_view type;
  };

  struct if_expression_variable: if_expression
  {
    bn::string_view name;

    if_expression_variable(bn::string_view type_, bn::string_view name_):
      if_expression(type_), name(name_) {}
  };

  struct if_expression_value: if_expression
  {
    bn::string_view value;

    if_expression_value(bn::string_view type_, bn::string_view value_):
      if_expression(type_), value(value_) {}
  };

  struct if_condition
  {
    bn::string_view op;
    neo::types::if_expression* left;
    neo::types::if_expression* right;

    if_condition(
      bn::string_view op_,
      neo::types::if_expression* left_,
      neo::types::if_expression* right_
    ): op(op_),
       left(left_),
       right(right_) {}
  };

  struct if_event: event
  {
    int conditions_count;
    if_condition** conditions;
    int then_events_count;
    event** then_events;
    int else_events_count;
    event** else_events;

    if_event(
      bn::string_view type_,
      int conditions_count_,
      if_condition** conditions_,
      int then_events_count_,
      event** then_events_,
      int else_events_count_,
      event** else_events_
    ): event(type_),
       conditions_count(conditions_count_),
       conditions(conditions_),
       then_events_count(then_events_count_),
       then_events(then_events_),
       else_events_count(else_events_count_),
       else_events(else_events_) {}
  };

  struct disable_actor_event: event
  {
    bn::string_view actor;
    disable_actor_event(bn::string_view type_, bn::string_view actor_):
      event(type_), actor(actor_) {}
  };

  struct enable_actor_event: event
  {
    bn::string_view actor;
    enable_actor_event(bn::string_view type_, bn::string_view actor_):
      event(type_), actor(actor_) {}
  };

  struct play_music_event: event
  {
    bn::string_view music_name;
    bn::fixed volume;
    bool loop;
    play_music_event(bn::string_view type_, bn::string_view music_name_, bn::fixed volume_, bool loop_):
      event(type_), music_name(music_name_), volume(volume_), loop(loop_) {}
  };

  struct stop_music_event: event
  {
    stop_music_event(bn::string_view type_):
      event(type_) {}
  };

  struct play_sound_event: event
  {
    bn::string_view sound_name;
    bn::fixed volume;
    bn::fixed speed;
    bn::fixed panning;
    int priority;
    play_sound_event(
      bn::string_view type_,
      bn::string_view sound_name_,
      bn::fixed volume_,
      bn::fixed speed_,
      bn::fixed panning_,
      int priority_
    ):
      event(type_),
      sound_name(sound_name_),
      volume(volume_),
      speed(speed_),
      panning(panning_),
      priority(priority_) {}
  };

  struct execute_script_event: event
  {
    bn::string_view name;
    execute_script_event(bn::string_view type_, bn::string_view name_):
      event(type_), name(name_) {}
  };

  struct move_camera_to_event: event
  {
    event_value* x;
    event_value* y;
    event_value* duration;
    bool allow_diagonal;
    bn::string_view direction_priority;
    move_camera_to_event(
      bn::string_view type_,
      event_value* x_,
      event_value* y_,
      event_value* duration_,
      bool allow_diagonal_,
      bn::string_view direction_priority_
    ):
      event(type_),
      x(x_),
      y(y_),
      duration(duration_),
      allow_diagonal(allow_diagonal_),
      direction_priority(direction_priority_) {}
  };

  struct sensor
  {
    bn::string_view _id;
    int x;
    int y;
    int width;
    int height;
    int events_count;
    event** events;

    inline bool is_inside (int tile_x, int tile_y) {
      return tile_x >= x && tile_x < (x + width) && tile_y >= y && tile_y < (y + height);
    }
  };

  struct map
  {
    int width;
    int height;
    event_value* grid_size;
    int* collisions;
    int sensors_count;
    sensor** sensors;

    inline int to_pixel_x (neo::variables::registry& variables, int tile_x)
    {
      return tile_x * grid_size->as_int(variables);
    }

    inline int to_tile_x (neo::variables::registry& variables, int pixel_x)
    {
      return pixel_x / grid_size->as_int(variables);
    }

    inline int to_pixel_y (neo::variables::registry& variables, int tile_y)
    {
      return tile_y * grid_size->as_int(variables);
    }

    inline int to_tile_y (neo::variables::registry& variables, int pixel_y)
    {
      return pixel_y / grid_size->as_int(variables);
    }

    inline int pixel_width (neo::variables::registry& variables) const
    {
      return width * grid_size->as_int(variables);
    }

    inline int pixel_height (neo::variables::registry& variables) const
    {
      return height * grid_size->as_int(variables);
    }

    inline int tile_index (int tile_x, int tile_y)
    {
      return tile_y * width + tile_x;
    }

    inline bool has_collision (int tile_x, int tile_y)
    {
      if (tile_x < 0 || tile_x >= width || tile_y < 0 || tile_y >= height)
      {
        return true;
      }

      return collisions[tile_index(tile_x, tile_y)] == 1;
    }

    inline sensor* get_sensor (int tile_x, int tile_y)
    {
      if (sensors == nullptr)
      {
        return nullptr;
      }

      for (int i = 0; i < sensors_count; i++)
      {
        if (sensors[i]->is_inside(tile_x, tile_y))
        {
          return sensors[i];
        }
      }

      return nullptr;
    }
  };

  struct actor
  {
    bn::string_view _id;
    bn::string_view name;
    event_value* x;
    event_value* y;
    event_value* z;
    neo::types::direction direction;
    bn::sprite_item sprite;
    int init_events_count;
    event** init_events;
    int interact_events_count;
    event** interact_events;
    int update_events_count;
    event** update_events;
  };

  struct sprite
  {
    bn::string_view _id;
    bn::string_view name;
    event_value* x;
    event_value* y;
    event_value* z;
    bn::sprite_item sprite;
  };

  struct script
  {
    bn::string_view _id;
    bn::string_view name;
    int events_count;
    event** events;
  };

  struct scene
  {
    // Scene
    bn::string_view _id;
    bn::string_view name;
    bn::regular_bg_item background;
    int event_count;
    event** events;
    // Player
    bool has_player;
    event_value* start_x;
    event_value* start_y;
    event_value* start_z;
    neo::types::direction start_direction;
    bn::sprite_item player_sprite;
    // Map data
    map* map_data;
    // Actors
    int actors_count;
    actor** actors;
    // Sprites
    int sprites_count;
    sprite** sprites;

    inline bool is (bn::string_view name_)
    {
      return _id == name_ || name == name_;
    }
  };
}

#endif
