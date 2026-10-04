#include <neo_logs.h>

#include <bn_core.h>
#include <bn_log.h>
#include <bn_string_view.h>
#include <bn_blending.h>
#include <bn_blending_actions.h>
#include <bn_regular_bg_ptr.h>
#include <bn_music.h>
#include <bn_sound.h>
#include <bn_vector.h>

#include "bn_music_items_info.h"
#include "bn_sound_items_info.h"

#include <neo_types.h>
#include <neo_variables.h>

// The generated neo_scenes.h defines namespace-scope data (scene, actor and
// animation objects) plus get_scene()/get_script(), so only one translation
// unit may include it (game.cpp). Declare the one function needed here so
// the linker resolves it against game.o instead.
namespace neo::scenes
{
  neo::types::script get_script(bn::string_view name);
}

#include "game.h"
#include "commons.h"
#include "fade.h"
#include "buttons.h"
#include "actor.h"
#include "menu.h"
#include "sprite.h"
#include "sensor.h"
#include "dialog.h"
#include "camera.h"
#include "save.h"
#include "conditions.h"
#include "effects.h"
#include "events.h"

namespace neo::events
{
  namespace
  {
    // Re-entrancy guard for update_scripted_events(): polling an
    // on-button-press handler runs exec_event, which can register more
    // scripted events; the nested call must not poll again.
    bool polling_scripted_events = false;
  }

  void exec_event (neo::game* game, const neo::types::event* e, bool is_loop) {
    /**
     * @name wait
     * @param duration number (default: 500)
     */
    if (e->type == "wait")
    {
      const neo::types::wait_event* wait_evt =
        static_cast<const neo::types::wait_event*>(e);
      game->wait(wait_evt->duration->as_int(game->variables));
    }

    /**
     * @name fade-in
     * @param duration number (default: 500)
     */
    else if (e->type == "fade-in" && game->scene_bg.has_value())
    {
      const neo::types::fade_event* fade_evt =
        static_cast<const neo::types::fade_event*>(e);

      int duration = fade_evt->duration->as_int(game->variables);
      BN_LOG("Fade-in duration: ", duration);

      game->enable_blending();
      neo::fade::enter(game, *game->scene_bg, duration);
      game->disable_blending();
    }

    /**
     * @name fade-out
     * @param duration number (default: 500)
     */
    else if (e->type == "fade-out" && game->scene_bg.has_value())
    {
      const neo::types::fade_event* fade_evt =
        static_cast<const neo::types::fade_event*>(e);

      game->enable_blending();
      neo::fade::exit(game, *game->scene_bg, fade_evt->duration->as_int(game->variables));
    }

    /**
     * @name wait-for-button
     * @param buttons array of button names (event is ignored if empty)
     */
    else if (e->type == "wait-for-button")
    {
      if (!game->is_input_enabled)
      {
        return;
      }

      const neo::types::button_event* button_evt =
        static_cast<const neo::types::button_event*>(e);
      while (!neo::buttons::any_pressed(button_evt->buttons) && !game->scene_changed)
      {
        game->update_frame();
      }

      BN_LOG("Wait-for-button event completed");
    }

    /**
     * @name disable-input
     * Disables player input until enabled again with enable-input event.
     */
    else if (e->type == "disable-input")
    {
      game->is_input_enabled = false;
    }

    /**
     * @name enable-input
     * Enables player input if it was disabled with disable-input event.
     */
    else if (e->type == "enable-input")
    {
      game->is_input_enabled = true;
    }

    /**
     * @name save-game
     * Saves variables, current scene id, player position, and actors position to SRAM/Flash.
     */
    else if (e->type == "save-game")
    {
      neo::save::write(game);
    }

    /**
     * @name load-game
     * Loads variables, last saved scene, player position, and actors position from SRAM/Flash.
     */
    else if (e->type == "load-game")
    {
      neo::save::load(game);
    }

    /**
     * @name save-state
     * Saves current scene id, player position, and actors position to RAM.
     */
    else if (e->type == "save-state")
    {
      neo::save::save_state(game);
    }

    /**
     * @name load-state
     * Loads last saved state from RAM (scene, player position, actors position).
     */
    else if (e->type == "load-state")
    {
      neo::save::load_state(game);
    }

    /**
     * @name go-to-scene
     * @param target string — Scene name, without scene_ prefix (default: "default")
     * @param start.object object with:
     *   x number (default: 0)
     *   y number (default: 0)
     *   direction string (default: "down")
     */
    else if (e->type == "go-to-scene")
    {
      const neo::types::scene_event* scene_evt =
        static_cast<const neo::types::scene_event*>(e);
      game->scene_changed = true;
      game->current_scene = scene_evt->target;
      game->last_goto_event = const_cast<neo::types::scene_event*>(scene_evt);
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
        if (!game->is_input_enabled)
        {
          return;
        }

        if (neo::buttons::any_pressed(button_evt->buttons))
        {
          BN_LOG("Button pressed, executing events");
          for (int i = 0; i < button_evt->events_count; ++i)
          {
            neo::types::event* ev = button_evt->events[i];
            exec_event(game, ev, true);
          }
        }
      } else {
        BN_LOG("Registering on-button-press scripted event");
        game->scripted_events_count++;
        game->scripted_events.push_back(const_cast<neo::types::event*>(e));
      }
    }

    /**
     * @name show-dialog
     * @param text string — Dialog text
     * @param speed string — Text reveal speed (slow, normal, fast)
     */
    else if (e->type == "show-dialog")
    {
      const neo::types::dialog_event* dialog_evt =
        static_cast<const neo::types::dialog_event*>(e);
      neo::dialog* d = new neo::dialog(game, dialog_evt->lines);
      d->set_direction(dialog_evt->direction);
      d->set_z_order(dialog_evt->z);
      d->set_speed(dialog_evt->speed);
      d->set_portrait(dialog_evt->portrait, dialog_evt->portrait_position);
      d->show();
      delete d;
    }

    /**
     * @name show-menu
     * @param choices array of menu choices — Menu choices
     */
    else if (e->type == "show-menu")
    {
      const neo::types::menu_event* menu_evt =
        static_cast<const neo::types::menu_event*>(e);

      // Only choices whose conditions all pass are displayed
      bn::vector<neo::types::menu_choice, 5> visible_choices;
      int visible_indices[5] = {};
      for (int i = 0; i < menu_evt->choices.size(); ++i)
      {
        const neo::types::menu_choice& candidate = menu_evt->choices[i];
        bool visible = true;
        for (int j = 0; j < candidate.conditions_count; ++j)
        {
          if (!neo::conditions::evaluate_condition(game, candidate.conditions[j]))
          {
            visible = false;
            break;
          }
        }

        if (visible)
        {
          visible_indices[visible_choices.size()] = i;
          visible_choices.push_back(candidate);
        }
      }

      if (visible_choices.empty())
      {
        BN_LOG("No visible menu choice, skipping menu");
        return;
      }

      neo::menu* m = new neo::menu(game, visible_choices);
      m->set_direction(menu_evt->direction);
      m->set_z_order(menu_evt->z);
      BN_LOG("Opening menu");
      int selected = m->show();
      delete m;

      // Execute selected choice events
      if (selected >= 0 && selected < visible_choices.size())
      {
        neo::types::menu_choice choice = menu_evt->choices[visible_indices[selected]];
        BN_LOG("Executing menu choice events for choice: ", choice.text);
        for (int i = 0; i < choice.events_count; ++i)
        {
          neo::types::event* ev = choice.events[i];
          exec_event(game, ev, is_loop);
        }
      }
    }

    /**
     * @name set-variable
     * @param name string — Variable name
     * @param value string — Variable value (amount for increment/decrement)
     * @param operation string — set (default), increment or decrement
     */
    else if (e->type == "set-variable")
    {
      const neo::types::set_variable_event* set_var_evt =
        static_cast<const neo::types::set_variable_event*>(e);

      if (
        set_var_evt->operation == neo::types::variable_operation::INCREMENT ||
        set_var_evt->operation == neo::types::variable_operation::DECREMENT
      )
      {
        if (game->variables.has(set_var_evt->key))
        {
          neo::variables::variable& var = game->variables.get(set_var_evt->key);
          int amount = set_var_evt->value->as_int();
          var.set_int(var.as_int() + (
            set_var_evt->operation == neo::types::variable_operation::INCREMENT ? amount : -amount
          ));
        }
      }
      else
      {
        game->variables.set(set_var_evt->key, set_var_evt->value);
      }
    }

    else if (e->type == "if")
    {
      const neo::types::if_event* if_evt =
        static_cast<const neo::types::if_event*>(e);

      bool result = true;
      for (int i = 0; i < if_evt->conditions_count; ++i)
      {
        if (!neo::conditions::evaluate_condition(game, if_evt->conditions[i]))
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
          exec_event(game, ev, is_loop);
        }
      } else {
        for (int i = 0; i < if_evt->else_events_count; ++i)
        {
          neo::types::event* ev = if_evt->else_events[i];
          exec_event(game, ev, is_loop);
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
      bn::string_view actor_reference = game->resolve_actor_reference(disable_actor_evt->actor);

      for (int i = 0; i < game->actors_count; ++i)
      {
        if (
          game->actors[i]->definition->name == actor_reference ||
          game->actors[i]->definition->_id == actor_reference
        ) {
          BN_LOG("Disabling actor: ", game->actors[i]->definition->name);
          game->actors[i]->disable();
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
      bn::string_view actor_reference = game->resolve_actor_reference(enable_actor_evt->actor);

      for (int i = 0; i < game->actors_count; ++i)
      {
        if (
          game->actors[i]->definition->name == actor_reference ||
          game->actors[i]->definition->_id == actor_reference
        )
        {
          BN_LOG("Enabling actor: ", game->actors[i]->definition->name);
          game->actors[i]->enable();
          break;
        }
      }
    }

    /**
     * @name disable-sprite
     * @param sprite string — Sprite name
     */
    else if (e->type == "disable-sprite")
    {
      const neo::types::disable_sprite_event* disable_sprite_evt =
        static_cast<const neo::types::disable_sprite_event*>(e);

      for (int i = 0; i < game->sprites_count; ++i)
      {
        if (
          game->sprites[i]->definition->name == disable_sprite_evt->sprite ||
          game->sprites[i]->definition->_id == disable_sprite_evt->sprite
        ) {
          BN_LOG("Disabling sprite: ", game->sprites[i]->definition->name);
          game->sprites[i]->disable();
          break;
        }
      }
    }

    /**
     * @name enable-sprite
     * @param sprite string — Sprite name
     */
    else if (e->type == "enable-sprite")
    {
      const neo::types::enable_sprite_event* enable_sprite_evt =
        static_cast<const neo::types::enable_sprite_event*>(e);

      for (int i = 0; i < game->sprites_count; ++i)
      {
        if (
          game->sprites[i]->definition->name == enable_sprite_evt->sprite ||
          game->sprites[i]->definition->_id == enable_sprite_evt->sprite
        )
        {
          BN_LOG("Enabling sprite: ", game->sprites[i]->definition->name);
          game->sprites[i]->enable();
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
      bool found = false;

      for (const auto& [item, name] : bn::music_items_info::span)
      {
        if (name == music_evt->music_name && !bn::music::playing())
        {
          BN_LOG("Playing music: ", name);
          found = true;
          item.play(music_evt->volume / 100, music_evt->loop);

          break;
        }
      }

      if (!found)
      {
        BN_LOG("Music not found: ", music_evt->music_name);
      }
    }

    /**
     * @name stop-music
     */
    else if (e->type == "stop-music")
    {
      BN_LOG("Stopping music");
      const auto& current_music = bn::music::playing_item();

      if (current_music.has_value())
      {
        for (int i = (int)(bn::music::volume() * 100); i >= 0 && !game->scene_changed; i -= 1)
        {
          BN_LOG("Fading out music to: ", i);
          bn::music::set_volume(i / 100.0);
          game->wait(10);
          game->update_frame();
        }

        bn::music::stop();
      }
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
            sound_evt->volume / 100,
            sound_evt->speed,
            sound_evt->panning / 100
          );

          break;
        }
      }
    }

    /**
     * @name execute-script
     * @param name string — Script name
     */
    else if (e->type == "execute-script")
    {
      const neo::types::execute_script_event* script_evt =
        static_cast<const neo::types::execute_script_event*>(e);
      neo::types::script script = neo::scenes::get_script(script_evt->name);
      bn::vector<neo::variables::variable, 10> previous_parameters;

      for (int i = 0; i < script.parameters_count; ++i)
      {
        const bn::string_view parameter_name = script.parameters[i];
        previous_parameters.push_back(game->variables.get(parameter_name));

        if (i < script_evt->arguments_count && script_evt->arguments != nullptr)
        {
          const neo::types::event_value* argument = script_evt->arguments[i];
          game->variables.set_raw(
            parameter_name,
            argument->as_int(game->variables),
            argument->as_bool(game->variables),
            argument->as_string(game->variables)
          );
        }
      }

      if (script.events_count > 0 && script.events != nullptr)
      {
        BN_LOG("Executing script: ", script.name, ", in loop:", is_loop);

        for (int i = 0; i < script.events_count; ++i)
        {
          neo::types::event* ev = script.events[i];

          BN_LOG("Executing script event: ", ev->type);
          exec_event(game, ev, is_loop);
        }
      }

      for (int i = 0; i < script.parameters_count; ++i)
      {
        game->variables.get(script.parameters[i]).assign(previous_parameters[i]);
      }
    }

    /**
     * @name parallel-events
     * @param events array of events — Instant events are executed one after
     * another, within the same frame. fade-in/fade-out, move-camera-to,
     * move-actor-to, move-player-to, set-palette-effect and wave-effect
     * (unless it has a duration of 0, which runs until the scene changes)
     * run concurrently with each other instead: they're started here, and
     * this event doesn't return control to the rest of the script until
     * every one of them is done (i.e. as long as the longest-running one
     * takes).
     */
    else if (e->type == "parallel-events")
    {
      neo::types::parallel_event* parallel_evt =
        const_cast<neo::types::parallel_event*>(
          static_cast<const neo::types::parallel_event*>(e));

      parallel_evt->exec(game, is_loop);

      if (!parallel_evt->pending.empty())
      {
        game->active_parallel_events.push_back(parallel_evt);
      }

      while (!parallel_evt->pending.empty() && !game->scene_changed)
      {
        game->update_frame();
      }
    }

    /**
     * @name set-palette-effect
     * @param target string — Which palettes to affect (background, sprite, both)
     * @param effect string — Which effect to change (brightness, contrast, intensity, grayscale, hue-shift)
     * @param value number — Target value, in percent (default: 100)
     * @param duration number — Duration in milliseconds (default: 200)
     */
    else if (e->type == "set-palette-effect")
    {
      const neo::types::set_palette_effect_event* palette_evt =
        static_cast<const neo::types::set_palette_effect_event*>(e);

      bn::fixed from_value = neo::effects::get_palette_effect(palette_evt->target, palette_evt->effect);
      bn::fixed to_value = palette_evt->value / 100;
      int frames = palette_evt->duration->as_int(game->variables) / 16;

      if (frames <= 0)
      {
        neo::effects::set_palette_effect(palette_evt->target, palette_evt->effect, to_value);
      }
      else
      {
        for (int frame = 1; frame <= frames && !game->scene_changed; ++frame)
        {
          bn::fixed t = bn::fixed(frame) / frames;
          neo::effects::set_palette_effect(
            palette_evt->target, palette_evt->effect, from_value + (to_value - from_value) * t);
          game->update_frame();
        }

        neo::effects::set_palette_effect(palette_evt->target, palette_evt->effect, to_value);
      }
    }

    /**
     * @name wave-effect
     * @param target string — Which to distort (background, sprite, both) (default: "both")
     * @param amplitude number — Wave displacement, in pixels (default: 4)
     * @param speed number — Degrees of phase advanced per frame (default: 4)
     * @param frequency number — Number of full sine cycles across the screen (default: 1)
     * @param duration number — Duration in milliseconds, 0 runs until the scene changes (default: 0)
     * @param envelope string — Amplitude ramp: "in" (0%->100%) or "in-out" (0%->100%->0%) (default: "in")
     */
    else if (e->type == "wave-effect")
    {
      const neo::types::wave_effect_event* wave_evt =
        static_cast<const neo::types::wave_effect_event*>(e);

      neo::effects::start_wave_effect(
        game,
        wave_evt->target, wave_evt->amplitude, wave_evt->speed, wave_evt->frequency,
        wave_evt->duration->as_int(game->variables) / 16, wave_evt->envelope
      );
    }

    /**
     * @name move-camera-to
     * @param x number — Target X position in pixels
     * @param y number — Target Y position in pixels
     * @param duration number — Duration in milliseconds
     * @param allow_diagonal boolean — Whether to allow diagonal movement (default: false)
     * @param direction_priority string — Direction priority for movement (default: "horizontal")
     */
    else if (e->type == "move-camera-to")
    {
      const neo::types::move_camera_to_event* move_camera_evt =
        static_cast<const neo::types::move_camera_to_event*>(e);

      BN_LOG("Moving camera to x=", move_camera_evt->x->as_int(game->variables), ", y=", move_camera_evt->y->as_int(game->variables));

      neo::camera::move_to(
        game,
        *game->active_scene,
        move_camera_evt->x->as_int(game->variables),
        move_camera_evt->y->as_int(game->variables),
        move_camera_evt->duration->as_int(game->variables),
        move_camera_evt->allow_diagonal,
        move_camera_evt->direction_priority
      );
    }

    /**
     * @name follow-actor
     * @param actor string — Actor name
     * @param duration number — Duration in milliseconds
     * @param allow_diagonal boolean — Whether to allow diagonal movement (default: false)
     * @param direction_priority string — Direction priority for movement (default: "horizontal")
     */
    else if (e->type == "follow-actor")
    {
      const neo::types::follow_actor_event* follow_actor_evt =
        static_cast<const neo::types::follow_actor_event*>(e);
      bn::string_view actor_reference = game->resolve_actor_reference(follow_actor_evt->actor);

      for (int i = 0; i < game->actors_count; ++i)
      {
        if (
          game->actors[i]->definition->name == actor_reference ||
          game->actors[i]->definition->_id == actor_reference
        )
        {
          BN_LOG("Following actor: ", game->actors[i]->definition->name);

          game->camera_target = game->actors[i];

          neo::camera::follow(
            game,
            *game->active_scene,
            game->actors[i],
            follow_actor_evt->duration->as_int(game->variables),
            follow_actor_evt->allow_diagonal,
            follow_actor_evt->direction_priority
          );

          break;
        }
      }
    }

    /**
     * @name follow-player
     * @param duration number — Duration in milliseconds
     * @param allow_diagonal boolean — Whether to allow diagonal movement (default: false)
     * @param direction_priority string — Direction priority for movement (default: "horizontal")
     */
    else if (e->type == "follow-player")
    {
      const neo::types::follow_player_event* follow_player_evt =
        static_cast<const neo::types::follow_player_event*>(e);

      if (game->player != nullptr)
      {
        BN_LOG("Following player");

        game->camera_target = game->player;

        neo::camera::follow(
          game,
          *game->active_scene,
          game->player,
          follow_player_evt->duration->as_int(game->variables),
          follow_player_evt->allow_diagonal,
          follow_player_evt->direction_priority
        );
      }
    }

    /**
     * @name freeze-camera
     * Stops the camera from following any actor, leaving it at its current position.
     */
    else if (e->type == "freeze-camera")
    {
      BN_LOG("Freezing camera");

      game->camera_target = nullptr;
    }

    /**
     * @name disable-player
     * Disables the player until enabled again with enable-player event.
     */
    else if (e->type == "disable-player")
    {
      if (game->player != nullptr)
      {
        BN_LOG("Disabling player");
        game->player->disable();
      }
    }

    /**
     * @name enable-player
     * Enables the player if it was disabled with disable-player event.
     */
    else if (e->type == "enable-player")
    {
      if (game->player != nullptr)
      {
        BN_LOG("Enabling player");
        game->player->enable();
      }
    }

    /**
     * @name move-actor-to
     * @param actor string — Actor name
     * @param x number — Target X position in tiles
     * @param y number — Target Y position in tiles
     * @param speed number — Movement speed in pixels per frame
     * @param direction_priority string — Direction priority for movement (default: "horizontal")
     * @param animation string — Animation id (none if empty)
     * @param backwards boolean — Keep current facing direction instead of turning towards the target (default: false)
     */
    else if (e->type == "move-actor-to")
    {
      const neo::types::move_actor_to_event* move_actor_evt =
        static_cast<const neo::types::move_actor_to_event*>(e);
      bn::string_view actor_reference = game->resolve_actor_reference(move_actor_evt->actor);

      for (int i = 0; i < game->actors_count; ++i)
      {
        if (
          game->actors[i]->definition->name == actor_reference ||
          game->actors[i]->definition->_id == actor_reference
        )
        {
          BN_LOG("Moving actor: ", game->actors[i]->definition->name, " to x=", move_actor_evt->x->as_int(game->variables), ", y=", move_actor_evt->y->as_int(game->variables));
          game->actors[i]->move_to(
            move_actor_evt->x->as_int(game->variables),
            move_actor_evt->y->as_int(game->variables),
            move_actor_evt->speed->as_int(game->variables),
            move_actor_evt->direction_priority,
            move_actor_evt->animation,
            move_actor_evt->backwards
          );
          break;
        }
      }
    }

    /**
     * @name move-player-to
     * @param x number — Target X position in tiles
     * @param y number — Target Y position in tiles
     * @param speed number — Movement speed in pixels per frame
     * @param direction_priority string — Direction priority for movement (default: "horizontal")
     * @param animation string — Animation id (none if empty)
     * @param backwards boolean — Keep current facing direction instead of turning towards the target (default: false)
     */
    else if (e->type == "move-player-to")
    {
      const neo::types::move_player_to_event* move_player_evt =
        static_cast<const neo::types::move_player_to_event*>(e);

      if (game->player != nullptr)
      {
        BN_LOG("Moving player to x=", move_player_evt->x->as_int(game->variables), ", y=", move_player_evt->y->as_int(game->variables));
        game->player->move_to(
          move_player_evt->x->as_int(game->variables),
          move_player_evt->y->as_int(game->variables),
          move_player_evt->speed->as_int(game->variables),
          move_player_evt->direction_priority,
          move_player_evt->animation,
          move_player_evt->backwards
        );
      }
    }

    /**
     * @name set-actor-position
     * @param actor string — Actor name
     * @param x number — Target X position in tiles
     * @param y number — Target Y position in tiles
     */
    else if (e->type == "set-actor-position")
    {
      const neo::types::set_actor_position_event* set_actor_position_evt =
        static_cast<const neo::types::set_actor_position_event*>(e);
      bn::string_view actor_reference = game->resolve_actor_reference(set_actor_position_evt->actor);

      for (int i = 0; i < game->actors_count; ++i)
      {
        if (
          game->actors[i]->definition->name == actor_reference ||
          game->actors[i]->definition->_id == actor_reference
        )
        {
          BN_LOG("Setting actor position: ", game->actors[i]->definition->name, " to x=", set_actor_position_evt->x->as_int(game->variables), ", y=", set_actor_position_evt->y->as_int(game->variables));
          game->actors[i]->set_tile_position(
            set_actor_position_evt->x->as_int(game->variables),
            set_actor_position_evt->y->as_int(game->variables)
          );
          break;
        }
      }
    }

    /**
     * @name set-player-position
     * @param x number — Target X position in tiles
     * @param y number — Target Y position in tiles
     */
    else if (e->type == "set-player-position")
    {
      const neo::types::set_player_position_event* set_player_position_evt =
        static_cast<const neo::types::set_player_position_event*>(e);

      if (game->player != nullptr)
      {
        BN_LOG("Setting player position to x=", set_player_position_evt->x->as_int(game->variables), ", y=", set_player_position_evt->y->as_int(game->variables));
        game->player->set_tile_position(
          set_player_position_evt->x->as_int(game->variables),
          set_player_position_evt->y->as_int(game->variables)
        );
      }
    }

    /**
     * @name set-actor-direction
     * @param actor string — Actor name
     * @param direction string — Direction to set (up, down, left, right)
     */
    else if (e->type == "set-actor-direction")
    {
      const neo::types::set_actor_direction_event* set_actor_direction_evt =
        static_cast<const neo::types::set_actor_direction_event*>(e);
      bn::string_view actor_reference = game->resolve_actor_reference(set_actor_direction_evt->actor);

      for (int i = 0; i < game->actors_count; ++i)
      {
        if (
          game->actors[i]->definition->name == actor_reference ||
          game->actors[i]->definition->_id == actor_reference
        )
        {
          BN_LOG("Setting actor direction: ", game->actors[i]->definition->name, " to direction=", static_cast<int>(set_actor_direction_evt->direction));
          game->actors[i]->set_direction(set_actor_direction_evt->direction);
          break;
        }
      }
    }

    /**
     * @name set-player-direction
     * @param direction string — Direction to set (up, down, left, right)
     */
    else if (e->type == "set-player-direction")
    {
      const neo::types::set_player_direction_event* set_player_direction_evt =
        static_cast<const neo::types::set_player_direction_event*>(e);

      if (game->player != nullptr)
      {
        BN_LOG("Setting player direction to direction=", static_cast<int>(set_player_direction_evt->direction));
        game->player->set_direction(set_player_direction_evt->direction);
      }
    }

    /**
     * @name set-background
     * @param background bn::regular_bg_item — Background item to set
     */
    else if (e->type == "set-background")
    {
      const neo::types::set_background_event* set_bg_evt =
        static_cast<const neo::types::set_background_event*>(e);

      bool was_visible = game->scene_bg.has_value() && game->scene_bg->visible();
      game->set_background(set_bg_evt->background, was_visible);
    }

    /**
     * @name set-sprite
     * @param sprite string — Sprite name or id
     * @param item bn::sprite_item — Sprite item to display
     */
    else if (e->type == "set-sprite")
    {
      const neo::types::set_sprite_event* set_sprite_evt =
        static_cast<const neo::types::set_sprite_event*>(e);

      for (int i = 0; i < game->sprites_count; ++i)
      {
        if (
          game->sprites[i]->definition->name == set_sprite_evt->sprite ||
          game->sprites[i]->definition->_id == set_sprite_evt->sprite
        ) {
          BN_LOG("Setting sprite: ", game->sprites[i]->definition->name);
          game->sprites[i]->set_item(set_sprite_evt->item);
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

  void update_scripted_events(neo::game* game)
  {
    if (polling_scripted_events)
    {
      return;
    }

    polling_scripted_events = true;

    for (int i = 0; i < game->scripted_events_count && !game->scene_changed; ++i)
    {
      exec_event(game, game->scripted_events[i], true);
    }

    polling_scripted_events = false;
  }

  void update_active_parallel_events(neo::game* game)
  {
    for (int i = game->active_parallel_events.size() - 1; i >= 0; --i)
    {
      if (game->active_parallel_events[i]->update())
      {
        game->active_parallel_events.erase(game->active_parallel_events.begin() + i);
      }
    }
  }
}

void neo::types::fade_event::start(neo::game* game_, bn::regular_bg_ptr& bg_, int duration_ms)
{
  game_ref = game_;
  bg = bg_;

  bool is_fade_in = type == "fade-in";
  int frames = duration_ms / 16;

  game_ref->enable_blending();

  if (frames <= 0)
  {
    bn::blending::set_fade_alpha(is_fade_in ? 0 : 1);
    bg->set_blending_enabled(false);
    bg->set_visible(is_fade_in);

    if (is_fade_in)
    {
      game_ref->disable_blending();
    }

    return;
  }

  bn::blending::set_black_fade_color();
  bg->set_blending_enabled(true);

  if (is_fade_in)
  {
    bg->set_visible(true);
    bn::blending::set_fade_alpha(1);
    action = bn::blending_fade_alpha_to_action(frames, 0);
  }
  else
  {
    bn::blending::set_fade_alpha(0);
    action = bn::blending_fade_alpha_to_action(frames, 1);
  }
}

bool neo::types::fade_event::update()
{
  if (!action.has_value())
  {
    // instant (duration<=0) fade already applied by start(): drop our bg copy so it can be freed
    bg.reset();
    return true;
  }

  action->update();

  if (!action->done())
  {
    return false;
  }

  bool is_fade_in = type == "fade-in";

  bn::blending::set_fade_alpha(is_fade_in ? 0 : 1);

  if (!is_fade_in)
  {
    bg->set_visible(false);
  }

  bg->set_blending_enabled(false);
  action.reset();
  bg.reset();

  if (is_fade_in)
  {
    game_ref->disable_blending();
  }

  return true;
}

void neo::types::parallel_event::exec(neo::game* game, bool is_loop)
{
  pending.clear();

  for (int i = 0; i < events_count; ++i)
  {
    neo::types::event* sub_evt = events[i];

    if (
      (sub_evt->type == "fade-in" || sub_evt->type == "fade-out") &&
      game->scene_bg.has_value()
    )
    {
      neo::types::fade_event* fade_evt =
        static_cast<neo::types::fade_event*>(sub_evt);

      fade_evt->start(game, *game->scene_bg, fade_evt->duration->as_int(game->variables));

      if (!fade_evt->update())
      {
        pending.push_back(fade_evt);
      }
    }
    else if (sub_evt->type == "move-camera-to")
    {
      neo::types::move_camera_to_event* move_evt =
        static_cast<neo::types::move_camera_to_event*>(sub_evt);

      move_evt->start(game);

      if (!move_evt->update())
      {
        pending.push_back(move_evt);
      }
    }
    else if (sub_evt->type == "move-actor-to" || sub_evt->type == "move-player-to")
    {
      neo::types::actor_move_event* move_evt =
        static_cast<neo::types::actor_move_event*>(sub_evt);

      move_evt->start(game);

      if (!move_evt->update())
      {
        pending.push_back(move_evt);
      }
    }
    else if (sub_evt->type == "set-palette-effect" || sub_evt->type == "wave-effect")
    {
      neo::types::event* effect_evt = sub_evt;

      if (effect_evt->type == "set-palette-effect")
      {
        neo::types::set_palette_effect_event* palette_evt =
          static_cast<neo::types::set_palette_effect_event*>(effect_evt);

        palette_evt->start(game);

        if (!palette_evt->update())
        {
          pending.push_back(palette_evt);
        }
      }
      else
      {
        neo::types::wave_effect_event* wave_evt =
          static_cast<neo::types::wave_effect_event*>(effect_evt);

        wave_evt->start(game);

        if (!wave_evt->update())
        {
          pending.push_back(wave_evt);
        }
      }
    }
    else
    {
      neo::events::exec_event(game, sub_evt, is_loop);
    }
  }
}
