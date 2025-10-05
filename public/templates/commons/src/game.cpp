#define BN_CFG_LOG_ENABLED true

#include <bn_core.h>
#include <bn_vector.h>
#include <bn_camera_actions.h>
#include <bn_log.h>
#include <bn_keypad.h>
#include "bn_audio.h"
#include "bn_music.h"
#include "bn_sound.h"
#include "bn_music_items_info.h"
#include "bn_sound_items_info.h"

#include <neo_types.h>
#include <neo_scenes.h>
#include <neo_variables.h>

#include "player.h"
#include "game.h"
#include "commons.h"
#include "utils.h"
#include "fade.h"
#include "buttons.h"
#include "actor.h"
#include "dialog.h"

namespace neo
{
  game::game(
    bn::camera_ptr& camera_,
    neo::player& player_
  ) :
    camera(camera_),
    player(player_),
    active_scene(nullptr),
    scene_bg(nullptr)
  {
    current_scene = "";
    scene_changed = false;

    scripted_events_count = 0;
    scripted_events.clear();

    variables.init();
  }

  void game::set_scene(bn::string_view scene_name)
  {
    current_scene = scene_name;
    scene_changed = true;
  }

  void game::run () {
    auto scene = neo::scenes::get_scene(current_scene);
    active_scene = &scene;

    if (active_scene == nullptr)
    {
      bn::core::update();

      return;
    }


    // Clean up old actors just in case
    for (int i = 0; i < actors_count; ++i)
    {
      delete actors[i];
    }
    actors.clear();
    actors_count = 0;

    bn::regular_bg_ptr bg = active_scene->background.create_bg(0, 0);
    scene_bg = &bg;
    scene_bg->set_camera(camera);
    scene_bg->set_visible(false);
    scene_bg->set_priority(3);
    scene_changed = false;

    BN_LOG("Starting scene: ", active_scene->name);

    if (active_scene->has_player && active_scene->map_data != nullptr)
    {
      BN_LOG("Has player");

      int x = active_scene->start_position[0];
      int y = active_scene->start_position[1];
      neo::types::direction dir = active_scene->start_direction;

      if (
        last_goto_event != nullptr &&
        last_goto_event->target == active_scene->name &&
        last_goto_event->start_position[0] != -1 &&
        last_goto_event->start_position[1] != -1
      )
      {
        x = last_goto_event->start_position[0];
        y = last_goto_event->start_position[1];
        dir = last_goto_event->start_direction;
        last_goto_event = nullptr;
      }

      BN_LOG("Player start position: ", x, ", ", y);

      player.play(
        *active_scene->map_data,
        x,
        y,
        dir
      );
    }

    // Actors
    actors.clear();
    actors_count = active_scene->actors_count;
    BN_LOG("Actors count: ", actors_count);

    if (active_scene->actors != nullptr)
    {
      for (int i = 0; i < actors_count; ++i)
      {
        BN_LOG("Creating actor: ", active_scene->actors[i]->name);
        neo::actor* a = new neo::actor(this, active_scene->actors[i]);
        actors.push_back(a);

        // Execute actors init events
        a->init();
      }
    }

    scripted_events_count = 0;
    scripted_events.clear();

    // Exec normal scene events
    for (int i = 0; i < active_scene->event_count; ++i)
    {
      neo::types::event* e = active_scene->events[i];
      exec_event(e, false);
    }

    while (!scene_changed)
    {
      // Exec in-loop scripted events
      for (int i = 0; i < scripted_events_count; ++i)
      {
        neo::types::event* e = scripted_events[i];
        exec_event(e, true);
      }

      if (active_scene->has_player)
      {
        player.update();
      }

      for (int i = 0; i < actors_count; ++i)
      {
        // Execute actors update events
        actors[i]->update();
      }

      bn::core::update();
    }

    bg.set_visible(false);
  }

  void game::exec_event (const neo::types::event* e, bool is_loop) {
    /**
     * @name wait
     * @param duration number (default: 500)
     */
    if (e->type == "wait")
    {
      const neo::types::wait_event* wait_evt =
        static_cast<const neo::types::wait_event*>(e);
      neo::utils::wait(wait_evt->duration);
    }

    /**
     * @name fade-in
     * @param duration number (default: 500)
     */
    else if (e->type == "fade-in" && scene_bg != nullptr)
    {
      const neo::types::fade_event* fade_evt =
        static_cast<const neo::types::fade_event*>(e);

      enable_blending();
      neo::fade::enter(*scene_bg, fade_evt->duration);
      disable_blending();
    }

    /**
     * @name fade-out
     * @param duration number (default: 500)
     */
    else if (e->type == "fade-out" && scene_bg != nullptr)
    {
      const neo::types::fade_event* fade_evt =
        static_cast<const neo::types::fade_event*>(e);

      enable_blending();
      neo::fade::exit(*scene_bg, fade_evt->duration);
    }

    /**
     * @name wait-for-button
     * @param buttons array of button names (event is ignored if empty)
     */
    else if (e->type == "wait-for-button")
    {
      const neo::types::button_event* button_evt =
        static_cast<const neo::types::button_event*>(e);
      while (!neo::buttons::any_pressed(button_evt->buttons))
      {
        bn::core::update();
      }
    }

    /**
     * @name go-to-scene
     * @param target string — Scene name, without scene_ prefix (default: "default")
     * @param start.object object with:
     *   x number (default: 0)
     *   y number (default: 0)
     *   direction string (default: "down")
     */
    else if (e->type == "go-to-scene")
    {
      const neo::types::scene_event* scene_evt =
        static_cast<const neo::types::scene_event*>(e);
      scene_changed = true;
      current_scene = scene_evt->target;
      last_goto_event = const_cast<neo::types::scene_event*>(scene_evt);
    }

    /**
     * @name on-button-press
     * @param buttons array of button names (event is ignored if empty)
     */
    else if (e->type == "on-button-press")
    {
      const neo::types::button_event* button_evt =
        static_cast<const neo::types::button_event*>(e);

      if (is_loop) {
        if (neo::buttons::any_pressed(button_evt->buttons))
        {
          BN_LOG("Button pressed, executing events");
          for (int i = 0; i < button_evt->events_count; ++i)
          {
            neo::types::event* ev = button_evt->events[i];
            exec_event(ev, true);
          }
        }
      } else {
        scripted_events_count++;
        scripted_events.push_back(const_cast<neo::types::event*>(e));
      }
    }

    /**
     * @name show-dialog
     * @param text string — Dialog text
     */
    else if (e->type == "show-dialog")
    {
      const neo::types::dialog_event* dialog_evt =
        static_cast<const neo::types::dialog_event*>(e);
      BN_LOG("Show dialog: ", dialog_evt->text);

      neo::dialog* d = new neo::dialog(this, dialog_evt->text);
      d->show(dialog_evt->text);
    }

    /**
     * @name set-variable
     * @param name string — Variable name
     * @param value string — Variable value
     */
    else if (e->type == "set-variable")
    {
      const neo::types::set_variable_event* set_var_evt =
        static_cast<const neo::types::set_variable_event*>(e);
      variables.set(set_var_evt->key, set_var_evt->value);
    }

    else if (e->type == "if")
    {
      const neo::types::if_event* if_evt =
        static_cast<const neo::types::if_event*>(e);

      bool result = true;
      for (int i = 0; i < if_evt->conditions_count; ++i)
      {
        if (!evaluate_condition(if_evt->conditions[i]))
        {
          result = false;
          break;
        }
      }

      if (result)
      {
        for (int i = 0; i < if_evt->then_events_count; ++i)
        {
          neo::types::event* ev = if_evt->then_events[i];
          exec_event(ev, true);
        }
      } else {
        for (int i = 0; i < if_evt->else_events_count; ++i)
        {
          neo::types::event* ev = if_evt->else_events[i];
          exec_event(ev, true);
        }
      }
    }

    /**
     * @name disable-actor
     * @param actor string — Actor name
     */
    else if (e->type == "disable-actor")
    {
      const neo::types::disable_actor_event* disable_actor_evt =
        static_cast<const neo::types::disable_actor_event*>(e);

      for (int i = 0; i < actors_count; ++i)
      {
        if (actors[i]->definition->name == disable_actor_evt->actor)
        {
          BN_LOG("Disabling actor: ", actors[i]->definition->name);
          actors[i]->disable();
          break;
        }
      }
    }

    /**
     * @name enable-actor
     * @param actor string — Actor name
     */
    else if (e->type == "enable-actor")
    {
      const neo::types::enable_actor_event* enable_actor_evt =
        static_cast<const neo::types::enable_actor_event*>(e);

      for (int i = 0; i < actors_count; ++i)
      {
        if (actors[i]->definition->name == enable_actor_evt->actor)
        {
          BN_LOG("Enabling actor: ", actors[i]->definition->name);
          actors[i]->enable();
          break;
        }
      }
    }

    /**
     * @name play-music
     * @param name string — Music name from assets/audio
     * @param volume bn::fixed (default: 1.0) / range: [0..1]
     * @param loop boolean — Whether to loop the music (default: false)
     */
    else if (e->type == "play-music")
    {
      const neo::types::play_music_event* music_evt =
        static_cast<const neo::types::play_music_event*>(e);

      for (const auto& [item, name] : bn::music_items_info::span)
      {
        if (name == music_evt->music_name)
        {
          BN_LOG("Playing music: ", name);
          item.play(music_evt->volume, true); // Game crash when loop=false and music ends

          break;
        }
      }
    }

    /**
     * @name stop-music
     */
    else if (e->type == "stop-music")
    {
      BN_LOG("Stopping music");
      bn::music::stop();
    }

    /**
     * @name play-sound
     * @param sound_name string — Sound name from sounds.xml
     * @param volume bn::fixed (default: 1.0) / range: [0..1]
     * @param speed bn::fixed (default: 1) /range: [0..64]
     * @param panning bn::fixed (default: 0) / range: [-1..1]
     * @param priority int (default: 32767) / range: [-32767..32767]
     */
    else if (e->type == "play-sound")
    {
      const neo::types::play_sound_event* sound_evt =
        static_cast<const neo::types::play_sound_event*>(e);

      for (const auto& [item, name] : bn::sound_items_info::span)
      {
        if (name == sound_evt->sound_name)
        {
          BN_LOG("Playing sound: ", name);

          item.play_with_priority(
            sound_evt->priority,
            sound_evt->volume,
            sound_evt->speed,
            sound_evt->panning
          );

          break;
        }
      }
    }

    /**
     * Unknown events are ignored
     */
    else
    {
      BN_LOG("Unknown event type: ", e->type);
    }
  }

  bool game::evaluate_condition (neo::types::if_condition* condition)
  {
    if (condition->op == "==")
    {
      return get_expression_value(condition->left) == get_expression_value(condition->right);
    }
    else if (condition->op == "!=")
    {
      return get_expression_value(condition->left) != get_expression_value(condition->right);
    }

    return false;
  }

  bn::string_view game::get_expression_value (neo::types::if_expression* expression)
  {
    if (expression->type == "variable")
    {
      auto* var_expr = static_cast<neo::types::if_expression_variable*>(expression);
      auto it = variables.all.find(var_expr->name);

      if (it != variables.all.end())
      {
        return it->second;
      }
    }
    else if (expression->type == "value")
    {
      auto* val_expr = static_cast<neo::types::if_expression_value*>(expression);
      return val_expr->value;
    }

    return "";
  }

  void game::enable_blending ()
  {
    player.sprite.set_blending_enabled(true);

    for (int i = 0; i < actors_count; ++i)
    {
      actors[i]->sprite.set_blending_enabled(true);
    }
  }

  void game::disable_blending ()
  {
    player.sprite.set_blending_enabled(false);

    for (int i = 0; i < actors_count; ++i)
    {
      actors[i]->sprite.set_blending_enabled(false);
    }
  }

  bool game::has_collision(int tile_x, int tile_y)
  {
    for (int i = 0; i < actors_count; ++i)
    {
      if (actors[i]->collides(tile_x, tile_y))
      {
        return true;
      }
    }

    return false;
  }

  neo::actor* game::get_actor_at(int tile_x, int tile_y, neo::types::direction direction)
  {
    int next_x = tile_x;
    int next_y = tile_y;

    if (direction == neo::types::direction::UP)
    {
      next_y -= 1;
    }
    else if (direction == neo::types::direction::DOWN)
    {
      next_y += 1;
    }
    else if (direction == neo::types::direction::LEFT)
    {
      next_x -= 1;
    }
    else if (direction == neo::types::direction::RIGHT)
    {
      next_x += 1;
    }

    for (int i = 0; i < actors_count; ++i)
    {
      if (actors[i]->collides(next_x, next_y))
      {
        return actors[i];
      }
    }

    return nullptr;
  }
}
