#include <neo_logs.h>

#include "save.h"
#include "game.h"
#include "actor.h"
#include "camera.h"

#include <bn_core.h>
#include <bn_sram.h>
#include <bn_log.h>
#include <bn_math.h>
#include <bn_unique_ptr.h>

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

    void capture_scene_state(neo::game* game, save_data& data)
    {
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
    }
  }

  void write(neo::game* game)
  {
    // Heap rather than stack: save_data is ~7.6KB
    bn::unique_ptr<save_data> data_ptr = bn::make_unique<save_data>();
    save_data& data = *data_ptr;

    // Format tag
    copy_string(data.format_tag, "GBASAV1", sizeof(data.format_tag));

    capture_scene_state(game, data);

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

  // Allocated on demand: ~7.6KB each, and most sessions never save or load
  BN_DATA_EWRAM static save_data* pending_save_data = nullptr;
  BN_DATA_EWRAM static save_data* ram_saved_state = nullptr;

  namespace
  {
    save_data& acquire_pending()
    {
      if (pending_save_data == nullptr)
      {
        pending_save_data = new save_data();
      }

      return *pending_save_data;
    }

    void release_pending()
    {
      delete pending_save_data;
      pending_save_data = nullptr;
    }
  }

  void save_state(neo::game* game)
  {
    if (ram_saved_state == nullptr)
    {
      ram_saved_state = new save_data();
    }

    copy_string(ram_saved_state->format_tag, "GBASAV1", sizeof(ram_saved_state->format_tag));
    capture_scene_state(game, *ram_saved_state);
    BN_LOG("Game state saved to RAM: scene=", ram_saved_state->scene_id, ", actors=", ram_saved_state->actors_count);
  }

  bool has_save_state()
  {
    return ram_saved_state != nullptr;
  }

  bool load_state(neo::game* game)
  {
    if (ram_saved_state == nullptr)
    {
      BN_LOG("No saved state found in RAM");
      return false;
    }

    save_data& pending = acquire_pending();
    pending = *ram_saved_state;

    BN_LOG("Loading saved state from RAM: scene=", pending.scene_id);

    // Transition to saved scene
    game->set_scene(pending.scene_id);
    return true;
  }

  bool has_save()
  {
    char tag[8] = {};
    bn::sram::read(tag);
    return bn::string_view(tag) == "GBASAV1";
  }

  bool has_pending_load()
  {
    return pending_save_data != nullptr;
  }

  const save_data& get_pending_save_data()
  {
    return acquire_pending();
  }

  void clear_pending_load()
  {
    release_pending();
  }

  bool load(neo::game* game)
  {
    bn::unique_ptr<save_data> data = bn::make_unique<save_data>();
    bn::sram::read(*data);

    if (bn::string_view(data->format_tag) != "GBASAV1")
    {
      BN_LOG("No valid save data found in SRAM");
      return false;
    }

    save_data& pending = acquire_pending();
    pending = *data;

    // Restore variables
    for (int i = 0; i < pending.variables_count; ++i)
    {
      const auto& var = pending.variables[i];
      game->variables.set_raw(var.name, var.int_value, var.bool_value, var.str_value);
    }

    BN_LOG("Loading saved game from SRAM: scene=", pending.scene_id, ", vars=", pending.variables_count);

    // Transition to saved scene
    game->set_scene(pending.scene_id);
    return true;
  }

  void apply_loaded_state_to_scene(neo::game* game)
  {
    if (pending_save_data == nullptr || game->active_scene == nullptr)
    {
      return;
    }

    const save_data& pending = *pending_save_data;

    if (!game->active_scene->is(pending.scene_id))
    {
      return;
    }

    BN_LOG("Applying loaded save state to scene: ", game->active_scene->name);

    // Restore player position & direction
    if (pending.has_player && game->player != nullptr)
    {
      game->player->set_direction(static_cast<neo::types::direction>(pending.player_direction));
      game->player->set_position(bn::fixed_point(
        pending.player_pixel_x,
        pending.player_pixel_y
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

      for (int j = 0; j < pending.actors_count; ++j)
      {
        const auto& saved_act = pending.actors[j];
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

    // current_scene is a view into the buffer about to be freed
    game->current_scene = game->active_scene->_id;
    release_pending();
  }
}
