#include <neo_logs.h>

#include <bn_core.h>
#include <bn_vector.h>
#include <bn_camera_actions.h>
#include <bn_log.h>
#include <bn_keypad.h>
#include <bn_audio.h>
#include <bn_math.h>

#include <neo_utils.h>
#include <neo_types.h>
#include <neo_scenes.h>
#include <neo_variables.h>

#include "game.h"
#include "commons.h"
#include "actor.h"
#include "sprite.h"
#include "sensor.h"
#include "camera.h"
#include "save.h"
#include "conditions.h"
#include "effects.h"
#include "events.h"

namespace neo
{
  game::game(
    bn::camera_ptr& camera_
  ) :
    camera(camera_),
    variables(),
    active_scene(nullptr),
    scene_bg(),
    player(nullptr),
    camera_target(nullptr)
  {
    current_scene = neo::scenes::STARTING_SCENE;
    scene_changed = false;

    scripted_events_count = 0;
    actors_count = 0;
    sprites_count = 0;
    sensors_count = 0;
    is_input_enabled = true;
  }

  void game::set_scene(bn::string_view scene_name)
  {
    current_scene = scene_name;
    scene_changed = true;
  }

  void game::set_background(bn::regular_bg_item background, bool visible)
  {
    // prevent NO MORE VRAM errors by first releasing the previous background pointer
    scene_bg.reset();
    scene_bg = background.create_bg(0, 0);
    scene_bg->set_camera(camera);
    scene_bg->set_visible(visible);
    scene_bg->set_priority(3);
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

    camera.set_position(0, 0);

    // Reset before deleting actors below, since it may point at one of them.
    camera_target = nullptr;

    // Clean up old player just in case
    if (player != nullptr)
    {
      delete player;
      player = nullptr;
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

    // Clean up old sensors just in case
    BN_LOG("Cleaning up old sensors, count:", sensors_count);
    if (sensors_count > 0)
    {
      for (int i = 0; i < sensors_count; ++i)
      {
        delete sensors[i];
      }

      sensors.clear();
      sensors_count = 0;
    }

    set_background(active_scene->background, false);
    scene_changed = false;

    BN_LOG("Starting scene: ", active_scene->name);

    if (active_scene->has_player && active_scene->player != nullptr && active_scene->map_data != nullptr)
    {
      BN_LOG("Has player");

      player = new neo::actor(this, active_scene->player, true);

      // The player follows the camera by default; other actors opt in via a follow event.
      camera_target = player;

      neo::camera::track(this, *active_scene, player);

      if (
        last_goto_event != nullptr &&
        active_scene->is(last_goto_event->target) &&
        last_goto_event->start_x->as_int(variables) != -1 &&
        last_goto_event->start_y->as_int(variables) != -1
      )
      {
        BN_LOG("Using last go-to-scene event position");

        int x = last_goto_event->start_x->as_int(variables);
        int y = last_goto_event->start_y->as_int(variables);

        BN_LOG("Player start position: x=", x, ", y=", y, ", z=", player->sprite.z_order());

        neo::types::direction dir = last_goto_event->start_direction;
        last_goto_event = nullptr;

        player->set_direction(dir);
        player->set_position(bn::fixed_point(
          active_scene->map_data->to_pixel_x(variables, x),
          active_scene->map_data->to_pixel_y(variables, y)
        ));
      }
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

    // Sensors
    if (sensors_count > 0)
    {
      sensors.clear();
    }

    sensors_count = 0;

    if (active_scene->map_data != nullptr && active_scene->map_data->sensors != nullptr)
    {
      sensors_count = active_scene->map_data->sensors_count;

      for (int i = 0; i < sensors_count; ++i)
      {
        neo::sensor* s = new neo::sensor(this, active_scene->map_data->sensors[i]);
        sensors.push_back(s);
      }
    }

    BN_LOG("Sensors count: ", sensors_count);

    // Scripts
    BN_LOG("Previous scripted events count: ", scripted_events_count);
    if (scripted_events_count > 0)
    {
      scripted_events.clear();
    }

    scripted_events_count = 0;
    active_parallel_events.clear();

    // The old wave_hbe (if any) referenced the previous scene's background.
    neo::effects::stop_wave_effect(this);

    // Apply any restored state from a loaded save game (player/actor positions & facing)
    neo::save::apply_loaded_state_to_scene(this);

    BN_LOG("Scene events count:", active_scene->event_count);

    // Exec normal scene events
    for (int i = 0; i < active_scene->event_count && !scene_changed; ++i)
    {
      BN_LOG("Getting scene event ", i);
      neo::types::event* e = active_scene->events[i];
      BN_LOG("Executing scene event: ", e->type);
      exec_event(e, false);
    }

    // Execute sprites init events
    if (!scene_changed && active_scene->sprites != nullptr)
    {
      for (int i = 0; i < sprites_count; ++i)
      {
        sprites[i]->init();
      }
    }

    // Execute player init events
    if (!scene_changed && player != nullptr)
    {
      player->init();
    }

    // Execute actors init events
    if (!scene_changed && active_scene->actors != nullptr)
    {
      for (int i = 0; i < actors_count; ++i)
      {
        actors[i]->init();
      }
    }

    while (!scene_changed)
    {

      if (active_scene->has_player && player != nullptr)
      {
        player->update();
      }

      for (int i = 0; i < actors_count; ++i)
      {
        // Execute actors update events
        actors[i]->update();
      }

      update_frame();
    }

    // go-to-scene doesn't wait for anything: if it fires in the same frame
    // as a still-running parallel effect (typically a fade-out started
    // alongside it), let that effect finish animating first, otherwise the
    // scene would be torn down mid-fade and the transition would just cut.
    while (!active_parallel_events.empty())
    {
      update_frame();
    }

    if (scene_bg.has_value())
    {
      scene_bg->set_visible(false);
    }

    if (player != nullptr)
    {
      delete player;
      player = nullptr;
    }
  }

  void game::exec_event (const neo::types::event* e, bool is_loop) {
    neo::events::exec_event(this, e, is_loop);
  }

  void game::enable_blending ()
  {
    if (player != nullptr)
    {
      player->sprite.set_blending_enabled(true);
    }

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
    if (player != nullptr)
    {
      player->sprite.set_blending_enabled(false);
    }

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

  void game::update_active_parallel_events()
  {
    neo::events::update_active_parallel_events(this);
  }

  void game::update_scripted_events()
  {
    neo::events::update_scripted_events(this);
  }

  void game::update_frame()
  {
    update_scripted_events();
    update_active_parallel_events();
    neo::effects::update_wave_effect(this);
    bn::core::update();
  }

  void game::wait(int milliseconds)
  {
    int frames = milliseconds / 16; // Assuming 60 FPS, 16ms per frame

    for (int i = 0; i < frames && !scene_changed; ++i)
    {
      update_frame();
    }
  }

  bool game::has_collision(int tile_x, int tile_y)
  {
    // Only actors whose collision group differs from the player's are
    // solid (group 0 = never solid; same group = pass-through, e.g.
    // teammates or moving platforms).
    int player_group = player != nullptr
      ? player->definition->collision_group : 1;

    for (int i = 0; i < actors_count; ++i)
    {
      neo::actor* actor_ = actors[i];

      if (
        actor_->definition->collision_group > 0 &&
        actor_->definition->collision_group != player_group &&
        actor_->collides(tile_x, tile_y)
      )
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

  neo::sprite* game::get_sprite_at(int tile_x, int tile_y, neo::types::direction direction)
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

    for (int i = 0; i < sprites_count; ++i)
    {
      if (sprites[i]->collides(next_x, next_y))
      {
        return sprites[i];
      }
    }

    return nullptr;
  }

  neo::sensor* game::get_sensor_at(int tile_x, int tile_y)
  {
    for (int i = 0; i < sensors_count; ++i)
    {
      if (sensors[i]->is_inside(tile_x, tile_y))
      {
        return sensors[i];
      }
    }

    return nullptr;
  }
}
