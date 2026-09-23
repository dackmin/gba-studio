#include <neo_logs.h>

#include "save.h"
#include "game.h"
#include "actor.h"
#include "camera.h"

#include <bn_core.h>
#include <bn_sram.h>
#include <bn_log.h>
#include <bn_math.h>

namespace neo::save
{
  namespace
  {
    void copy_string(char* dest, bn::string_view src, int max_len)
    {
      int len = bn::min(src.length(), max_len - 1);
      for (int i = 0; i < len; ++i)
      {
        dest[i] = src[i];
      }
      dest[len] = '\0';
    }
  }

  void write(neo::game* game)
  {
    save_data data;

    // Format tag
    copy_string(data.format_tag, "GBASAV1", sizeof(data.format_tag));

    // Current scene id / name
    copy_string(data.scene_id, game->current_scene, sizeof(data.scene_id));

    // Player position & state
    if (game->player != nullptr && game->active_scene != nullptr)
    {
      data.has_player = true;
      data.player_pixel_x = int(game->player->position.x());
      data.player_pixel_y = int(game->player->position.y());

      if (game->active_scene->map_data != nullptr)
      {
        data.player_tile_x = game->active_scene->map_data->to_tile_x(
          game->variables, int(game->player->position.x())
        );
        data.player_tile_y = game->active_scene->map_data->to_tile_y(
          game->variables, int(game->player->position.y())
        );
      }
      else
      {
        data.player_tile_x = data.player_pixel_x;
        data.player_tile_y = data.player_pixel_y;
      }

      data.player_direction = static_cast<int>(game->player->direction);
    }
    else
    {
      data.has_player = false;
    }

    // Actors position & state
    data.actors_count = bn::min(game->actors_count, 20);
    for (int i = 0; i < data.actors_count; ++i)
    {
      neo::actor* actor = game->actors[i];
      if (actor != nullptr && actor->definition != nullptr)
      {
        copy_string(data.actors[i].id, actor->definition->_id, sizeof(data.actors[i].id));
        copy_string(data.actors[i].name, actor->definition->name, sizeof(data.actors[i].name));
        data.actors[i].tile_x = actor->position.x().right_shift_integer();
        data.actors[i].tile_y = actor->position.y().right_shift_integer();
        data.actors[i].direction = static_cast<int>(actor->direction);
        data.actors[i].visible = actor->sprite.visible();
      }
    }

    // Variables
    data.variables_count = 0;
    for (const auto& item : game->variables.all)
    {
      if (data.variables_count >= 64)
      {
        break;
      }

      copy_string(data.variables[data.variables_count].name, item.first, sizeof(data.variables[data.variables_count].name));
      if (item.second != nullptr)
      {
        data.variables[data.variables_count].int_value = item.second->as_int();
        data.variables[data.variables_count].bool_value = item.second->as_bool();
        copy_string(data.variables[data.variables_count].str_value, item.second->as_string(), sizeof(data.variables[data.variables_count].str_value));
      }
      data.variables_count++;
    }

    bn::sram::write(data);
    BN_LOG("Game saved to SRAM: scene=", data.scene_id, ", vars=", data.variables_count, ", actors=", data.actors_count);
  }

  BN_DATA_EWRAM static save_data pending_save_data;
  BN_DATA_EWRAM static bool pending_load = false;

  bool has_save()
  {
    char tag[8] = {};
    bn::sram::read(tag);
    return bn::string_view(tag) == "GBASAV1";
  }

  bool has_pending_load()
  {
    return pending_load;
  }

  const save_data& get_pending_save_data()
  {
    return pending_save_data;
  }

  void clear_pending_load()
  {
    pending_load = false;
  }

  bool load(neo::game* game)
  {
    save_data data;
    bn::sram::read(data);

    if (bn::string_view(data.format_tag) != "GBASAV1")
    {
      BN_LOG("No valid save data found in SRAM");
      return false;
    }

    pending_save_data = data;
    pending_load = true;

    // Restore variables
    for (int i = 0; i < pending_save_data.variables_count; ++i)
    {
      const auto& var = pending_save_data.variables[i];
      game->variables.set_raw(var.name, var.int_value, var.bool_value, var.str_value);
    }

    BN_LOG("Loading saved game from SRAM: scene=", pending_save_data.scene_id, ", vars=", pending_save_data.variables_count);

    // Transition to saved scene
    game->set_scene(pending_save_data.scene_id);
    return true;
  }

  void apply_loaded_state_to_scene(neo::game* game)
  {
    if (!pending_load || game->active_scene == nullptr)
    {
      return;
    }

    if (!game->active_scene->is(pending_save_data.scene_id))
    {
      return;
    }

    BN_LOG("Applying loaded save state to scene: ", game->active_scene->name);

    // Restore player position & direction
    if (pending_save_data.has_player && game->player != nullptr)
    {
      game->player->set_direction(static_cast<neo::types::direction>(pending_save_data.player_direction));
      game->player->set_position(bn::fixed_point(
        pending_save_data.player_pixel_x,
        pending_save_data.player_pixel_y
      ));
      neo::camera::track(game, *game->active_scene, game->player);
    }

    // Restore actors positions, directions, and visibility
    for (int i = 0; i < game->actors_count; ++i)
    {
      neo::actor* actor = game->actors[i];
      if (actor == nullptr || actor->definition == nullptr)
      {
        continue;
      }

      for (int j = 0; j < pending_save_data.actors_count; ++j)
      {
        const auto& saved_act = pending_save_data.actors[j];
        if (
          actor->definition->_id == saved_act.id ||
          actor->definition->name == saved_act.name ||
          actor->definition->_id == saved_act.name ||
          actor->definition->name == saved_act.id
        )
        {
          actor->set_direction(static_cast<neo::types::direction>(saved_act.direction));
          actor->set_tile_position(saved_act.tile_x, saved_act.tile_y);
          if (!saved_act.visible)
          {
            actor->disable();
          }
          else
          {
            actor->enable();
          }
          break;
        }
      }
    }

    pending_load = false;
  }
}
