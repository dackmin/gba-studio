#define BN_CFG_LOG_ENABLED true

#include <bn_core.h>
#include <bn_vector.h>
#include <bn_camera_actions.h>
#include <bn_log.h>
#include <bn_keypad.h>
#include <bn_audio.h>
#include <bn_music.h>
#include <bn_sound.h>

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
#include "menu.h"
#include "sprite.h"
#include "dialog.h"
#include "camera.h"

namespace neo
{
  game::game(
    bn::camera_ptr& camera_,
    neo::player& player_
  ) :
    camera(camera_),
    player(player_),
    variables(),
    active_scene(nullptr),
    scene_bg(nullptr)
  {
    current_scene = neo::scenes::STARTING_SCENE;
    scene_changed = false;

    scripted_events_count = 0;
    actors_count = 0;
    sprites_count = 0;
  }

  void game::set_scene(bn::string_view scene_name)
  {
    current_scene = scene_name;
    scene_changed = true;
  }

  void game::run () {
    auto scene = neo::scenes::get_scene(current_scene);
    active_scene = &scene;

    BN_LOG("Loading scene: ", active_scene->name);

    if (active_scene == nullptr)
    {
      bn::core::update();

      return;
    }


    // Clean up old actors just in case
    BN_LOG("Cleaning up old actors, count:", actors_count);
    if (actors_count > 0)
    {
      for (int i = 0; i < actors_count; ++i)
      {
        delete actors[i];
      }

      actors.clear();
      actors_count = 0;
    }

    // Clean up old sprites just in case
    BN_LOG("Cleaning up old sprites, count:", sprites_count);
    if (sprites_count > 0)
    {
      for (int i = 0; i < sprites_count; ++i)
      {
        delete sprites[i];
      }

      sprites.clear();
      sprites_count = 0;
    }

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

      int x = active_scene->start_x->as_int(variables);
      int y = active_scene->start_y->as_int(variables);
      int z = active_scene->start_z->as_int(variables);
      neo::types::direction dir = active_scene->start_direction;

      if (
        last_goto_event != nullptr &&
        active_scene->is(last_goto_event->target) &&
        last_goto_event->start_x->as_int(variables) != -1 &&
        last_goto_event->start_y->as_int(variables) != -1
      )
      {
        BN_LOG("Using last go-to-scene event position");
        x = last_goto_event->start_x->as_int(variables);
        y = last_goto_event->start_y->as_int(variables);
        dir = last_goto_event->start_direction;
        last_goto_event = nullptr;
      }

      BN_LOG("Player start position: x=", x, ", y=", y, ", z=", z);

      player.play(
        *active_scene->map_data,
        x,
        y,
        z,
        dir,
        active_scene->player_sprite.create_sprite(0, 0),
        active_scene->player_sprite.tiles_item()
      );
    }

    // Actors
    BN_LOG("Actors count: ", active_scene->actors_count);
    if (actors_count > 0)
    {
      actors.clear();
    }

    actors_count = active_scene->actors_count;

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

    // Sprites
    BN_LOG("Sprites count: ", active_scene->sprites_count);
    if (sprites_count > 0)
    {
      sprites.clear();
    }

    sprites_count = active_scene->sprites_count;

    if (active_scene->sprites != nullptr)
    {
      for (int i = 0; i < sprites_count; ++i)
      {
        BN_LOG("Creating sprite: ", active_scene->sprites[i]->name);
        neo::sprite* s = new neo::sprite(this, active_scene->sprites[i]);
        sprites.push_back(s);
      }
    }

    // Scripts
    BN_LOG("Previous scripted events count: ", scripted_events_count);
    if (scripted_events_count > 0)
    {
      scripted_events.clear();
    }

    scripted_events_count = 0;

    BN_LOG("Scene events count:", active_scene->event_count);

    // Exec normal scene events
    for (int i = 0; i < active_scene->event_count; ++i)
    {
      BN_LOG("Getting scene event ", i);
      neo::types::event* e = active_scene->events[i];
      BN_LOG("Executing scene event: ", e->type);
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
      neo::utils::wait(wait_evt->duration->as_int(variables));
    }

    /**
     * @name fade-in
     * @param duration number (default: 500)
     */
    else if (e->type == "fade-in" && scene_bg != nullptr)
    {
      const neo::types::fade_event* fade_evt =
        static_cast<const neo::types::fade_event*>(e);

      int duration = fade_evt->duration->as_int(variables);
      BN_LOG("Fade-in duration: ", duration);

      enable_blending();
      neo::fade::enter(*scene_bg, duration);
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
      neo::fade::exit(*scene_bg, fade_evt->duration->as_int(variables));
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
        BN_LOG("Registering on-button-press scripted event");
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
      neo::dialog* d = new neo::dialog(this, dialog_evt->lines);
      d->set_direction(dialog_evt->direction);
      d->set_z_order(dialog_evt->z);
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
      neo::menu* m = new neo::menu(this, menu_evt->choices);
      m->set_direction(menu_evt->direction);
      m->set_z_order(menu_evt->z);
      int selected = m->show();
      delete m;

      // Execute selected choice events
      if (selected >= 0 && selected < menu_evt->choices_count)
      {
        neo::types::menu_choice choice = menu_evt->choices[selected];
        BN_LOG("Executing menu choice events for choice: ", choice.text);
        for (int i = 0; i < choice.events_count; ++i)
        {
          neo::types::event* ev = choice.events[i];
          exec_event(ev, is_loop);
        }
      }
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
          exec_event(ev, is_loop);
        }
      } else {
        for (int i = 0; i < if_evt->else_events_count; ++i)
        {
          neo::types::event* ev = if_evt->else_events[i];
          exec_event(ev, is_loop);
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
        if (
          actors[i]->definition->name == disable_actor_evt->actor ||
          actors[i]->definition->_id == disable_actor_evt->actor
        ) {
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
        if (
          actors[i]->definition->name == enable_actor_evt->actor ||
          actors[i]->definition->_id == enable_actor_evt->actor
        )
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
        if (name == music_evt->music_name && !bn::music::playing())
        {
          BN_LOG("Playing music: ", name);
          item.play(music_evt->volume / 100, music_evt->loop);

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
      const auto& current_music = bn::music::playing_item();

      if (current_music.has_value())
      {
        for (int i = (int)(bn::music::volume() * 100); i >= 0; i -= 1)
        {
          BN_LOG("Fading out music to: ", i);
          bn::music::set_volume(i / 100.0);
          neo::utils::wait(10);
          bn::core::update();
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

      if (script.events_count > 0 && script.events != nullptr)
      {
        BN_LOG("Executing script: ", script.name, ", in loop:", is_loop);

        for (int i = 0; i < script.events_count; ++i)
        {
          neo::types::event* ev = script.events[i];

          BN_LOG("Executing script event: ", ev->type);
          exec_event(ev, is_loop);
        }
      }
    }

    else if (e->type == "move-camera-to")
    {
      const neo::types::move_camera_to_event* move_camera_evt =
        static_cast<const neo::types::move_camera_to_event*>(e);

      neo::camera::move_to(
        this,
        *active_scene,
        move_camera_evt->x->as_int(variables),
        move_camera_evt->y->as_int(variables),
        move_camera_evt->duration->as_int(variables),
        move_camera_evt->allow_diagonal,
        move_camera_evt->direction_priority
      );
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
      bn::string_view left = get_expression_value(condition->left);
      bn::string_view right = get_expression_value(condition->right);

      BN_LOG("Evaluating condition: ", left, " == ", right);

      return left == right;
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

      if (!variables.has(var_expr->name))
      {
        BN_LOG("Variable not found: ", var_expr->name);
        return "";
      }

      // if comparison does not care about the type, always compares strings
      // TODO: allow gt/lt/... comparisons
      auto var_value = variables.get(var_expr->name);

      BN_LOG("[IF] Getting variable value: ", var_expr->name, "with value:", var_value.as_string());

      return var_value.as_string();
    }
    else if (expression->type == "value")
    {
      auto* val_expr = static_cast<neo::types::if_expression_value*>(expression);
      BN_LOG("[IF] Getting raw value: ", val_expr->value);
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

    for (int i = 0; i < sprites_count; ++i)
    {
      sprites[i]->inner_sprite.set_blending_enabled(true);
    }
  }

  void game::disable_blending ()
  {
    player.sprite.set_blending_enabled(false);

    // Actors
    for (int i = 0; i < actors_count; ++i)
    {
      actors[i]->sprite.set_blending_enabled(false);
    }

    // Sprites
    for (int i = 0; i < sprites_count; ++i)
    {
      sprites[i]->inner_sprite.set_blending_enabled(false);
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
