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
#include "hud.h"
#include "events.h"
#include "projectile.h"

namespace neo
{
  game::game(
    bn::camera_ptr& camera_
  ) :
    camera(camera_),
    variables(),
    active_scene(nullptr),
    scene_bg(camera_),
    cursor_sprite(),
    cursor_position(0, 0),
    player(nullptr),
    camera_target(nullptr)
  {
    current_scene = neo::scenes::STARTING_SCENE;
    scene_changed = false;

    scripted_events_count = 0;
    actors_count = 0;
    sprites_count = 0;
    sensors_count = 0;
    projectiles_count = 0;
    is_input_enabled = true;
  }

  void game::set_scene(bn::string_view scene_name)
  {
    current_scene = scene_name;
    scene_changed = true;
  }

  void game::reset()
  {
    variables.reset();
  }

  bn::string_view game::resolve_actor_reference(bn::string_view actor_reference)
  {
    constexpr char parameter_prefix[] = "__script_param_";
    constexpr int parameter_prefix_length = static_cast<int>(sizeof(parameter_prefix) - 1);

    for (int depth = 0; depth < 10 && actor_reference.size() >= parameter_prefix_length; ++depth)
    {
      bool is_parameter = true;
      for (int i = 0; i < parameter_prefix_length; ++i)
      {
        if (actor_reference[i] != parameter_prefix[i])
        {
          is_parameter = false;
          break;
        }
      }

      if (!is_parameter || !variables.has(actor_reference))
      {
        break;
      }

      bn::string_view resolved = variables.get(actor_reference).as_string();
      if (resolved == actor_reference)
      {
        break;
      }

      actor_reference = resolved;
    }

    return actor_reference;
  }

  void game::set_background(const neo::types::background& background, bool visible)
  {
    scene_bg.set(background, visible);
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
    cursor_sprite.reset();

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

    hud_sprites.clear();
    hud_text_sprites.clear();

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

    // Remove all active projectiles
    if (projectiles_count > 0)
    {
      for (int i = 0; i < projectiles_count; ++i)
      {
        delete projectiles[i];
      }

      projectiles.clear();
      projectiles_count = 0;
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

      // Point-and-click scenes start centered on the player but then leave the camera to the
      // cursor (see update_cursor())
      if (active_scene->scene_type == neo::types::scene_type::POINT_AND_CLICK)
      {
        camera_target = nullptr;
      }

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

    // Enable projectiles
    projectiles_count = 0;
    projectiles.clear();

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

    // HUD
    neo::hud::build(this);

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

    // Execute HUD init events
    if (active_scene->hud_data != nullptr)
    {
      for (int i = 0; i < active_scene->hud_data->init_events_count && !scene_changed; ++i)
      {
        exec_event(active_scene->hud_data->init_events[i], false);
      }
    }

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

    if (!scene_changed && active_scene->scene_type == neo::types::scene_type::POINT_AND_CLICK)
    {
      cursor_position = bn::fixed_point(0, 0);
      cursor_sprite = active_scene->cursor.create_sprite(0, 0);
      cursor_sprite->set_bg_priority(0);
      cursor_sprite->set_z_order(-1);
      set_cursor_sprite_position();
    }

    while (!scene_changed)
    {
      update_projectiles();
      update_cursor();

      if (active_scene->has_player && player != nullptr)
      {
        player->update();
      }

      // Execute HUD update events
      if (active_scene->hud_data != nullptr)
      {
        for (int i = 0; i < active_scene->hud_data->update_events_count && !scene_changed; ++i)
        {
          exec_event(active_scene->hud_data->update_events[i], true);
        }
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

    scene_bg.set_visible(false);
    cursor_sprite.reset();

    if (player != nullptr)
    {
      delete player;
      player = nullptr;
    }
  }

  void game::update_cursor()
  {
    if (
      !cursor_sprite.has_value() ||
      active_scene == nullptr ||
      active_scene->map_data == nullptr
    )
    {
      return;
    }

    const neo::types::map* map_data = active_scene->map_data;

    if (is_input_enabled)
    {
      int move_x = 0;
      int move_y = 0;

      if (bn::keypad::left_held()) move_x -= CURSOR_SPEED;
      if (bn::keypad::right_held()) move_x += CURSOR_SPEED;
      if (bn::keypad::up_held()) move_y -= CURSOR_SPEED;
      if (bn::keypad::down_held()) move_y += CURSOR_SPEED;

      constexpr int min_x = -neo::types::SCREEN_WIDTH / 2;
      constexpr int max_x = neo::types::SCREEN_WIDTH / 2 - CURSOR_EDGE_MARGIN;
      constexpr int min_y = -neo::types::SCREEN_HEIGHT / 2;
      constexpr int max_y = neo::types::SCREEN_HEIGHT / 2 - CURSOR_EDGE_MARGIN;

      int next_x = (int)cursor_position.x() + move_x;
      int next_y = (int)cursor_position.y() + move_y;
      int scroll_x = 0;
      int scroll_y = 0;

      if (next_x < min_x) {
        scroll_x = next_x - min_x;
        next_x = min_x;
      }

      if (next_x > max_x) {
        scroll_x = next_x - max_x;
        next_x = max_x;
      }

      if (next_y < min_y) {
        scroll_y = next_y - min_y;
        next_y = min_y;
      }

      if (next_y > max_y) {
        scroll_y = next_y - max_y;
        next_y = max_y;
      }

      cursor_position = bn::fixed_point(next_x, next_y);

      // Move camera with cursor
      if (camera_target == nullptr && (scroll_x != 0 || scroll_y != 0))
      {
        int view_x = (int)camera.x() + map_data->pixel_width(variables) / 2 -
          neo::types::SCREEN_WIDTH / 2;
        int view_y = (int)camera.y() + map_data->pixel_height(variables) / 2 -
          neo::types::SCREEN_HEIGHT / 2;
        int end_x, end_y;

        neo::camera::get_move_to_target(
          this,
          view_x + scroll_x,
          view_y + scroll_y,
          end_x,
          end_y
        );
        camera.set_position(end_x, end_y);
      }

      int origin_x = (int)camera.x() + map_data->pixel_width(variables) / 2;
      int origin_y = (int)camera.y() + map_data->pixel_height(variables) / 2;

      int cursor_min_x = bn::max(min_x, -origin_x);
      int cursor_max_x = bn::min(max_x,
        map_data->pixel_width(variables) - CURSOR_EDGE_MARGIN - origin_x);
      int cursor_min_y = bn::max(min_y, -origin_y);
      int cursor_max_y = bn::min(max_y,
        map_data->pixel_height(variables) - CURSOR_EDGE_MARGIN - origin_y);

      if (cursor_min_x <= cursor_max_x && cursor_min_y <= cursor_max_y)
      {
        cursor_position = bn::fixed_point(
          bn::min(bn::max((int)cursor_position.x(), cursor_min_x), cursor_max_x),
          bn::min(bn::max((int)cursor_position.y(), cursor_min_y), cursor_max_y)
        );
      }

      if (bn::keypad::a_pressed())
      {
        click_at(
          origin_x + (int)cursor_position.x(),
          origin_y + (int)cursor_position.y()
        );
      }
    }

    set_cursor_sprite_position();
  }

  void game::set_cursor_sprite_position()
  {
    if (!cursor_sprite.has_value())
    {
      return;
    }

    cursor_sprite->set_position(
      cursor_position.x() + cursor_sprite->dimensions().width() / 2,
      cursor_position.y() + cursor_sprite->dimensions().height() / 2
    );
  }

  void game::click_at(int pixel_x, int pixel_y)
  {
    if (!interact_at(pixel_x, pixel_y) && player != nullptr && player->sprite.visible())
    {
      player->walk_to(pixel_x, pixel_y);
    }
  }

  bool game::interact_at(int pixel_x, int pixel_y)
  {
    const neo::types::map* map_data = active_scene->map_data;
    int tile_x = pixel_x < 0 ? -1 : map_data->to_tile_x(variables, pixel_x);
    int tile_y = pixel_y < 0 ? -1 : map_data->to_tile_y(variables, pixel_y);

    for (int i = 0; i < actors_count; ++i)
    {
      neo::actor* actor_ = actors[i];

      if (
        actor_->definition->interact_events_count > 0 &&
        actor_->sprite.visible() &&
        actor_->collides(tile_x, tile_y)
      )
      {
        if (player != nullptr)
        {
          if (!actor_->definition->disable_direction_on_interact)
          {
            actor_->set_direction(neo::types::direction::PLAYER);
          }

          player->stop_walking();
        }

        for (int j = 0; j < actor_->definition->interact_events_count && !scene_changed; ++j)
        {
          exec_event(actor_->definition->interact_events[j], true);
        }

        return true;
      }
    }

    for (int i = 0; i < sprites_count; ++i)
    {
      neo::sprite* sprite_ = sprites[i];

      if (
        sprite_->definition->interact_events_count > 0 &&
        sprite_->inner_sprite.visible() &&
        sprite_->collides(tile_x, tile_y)
      )
      {
        if (player != nullptr)
        {
          player->stop_walking();
        }

        for (int j = 0; j < sprite_->definition->interact_events_count && !scene_changed; ++j)
        {
          exec_event(sprite_->definition->interact_events[j], true);
        }

        return true;
      }
    }

    neo::sensor* sensor_ = get_sensor_at(tile_x, tile_y);

    if (sensor_ != nullptr && sensor_->definition->interact_events_count > 0)
    {
      if (player != nullptr)
      {
        player->stop_walking();
      }

      sensor_->trigger_interact();

      return true;
    }

    return false;
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

  void game::update_projectiles()
  {
    for (int i = projectiles_count - 1; i >= 0 && !scene_changed; --i)
    {
      if (i < projectiles_count)
      {
        projectiles[i]->update();
      }
    }
  }

  void game::update_frame()
  {
    update_scripted_events();
    update_active_parallel_events();
    neo::effects::update_wave_effect(this);
    neo::hud::update(this);
    scene_bg.update();
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
    // Solidity depends on the collision group and the scene type:
    // - top-down, point-and-click & adventure: group 0 (the default) is
    //   solid like it always was;
    //   same-group actors are pass-through (e.g. teammates)
    // - side-scroller: group 0 is pass-through, groups 1-4 are solid
    //   when different from the player's (opt-in obstacles/enemies)
    bool top_down = active_scene != nullptr && (
      active_scene->scene_type == neo::types::scene_type::TOP_DOWN ||
      active_scene->scene_type == neo::types::scene_type::POINT_AND_CLICK ||
      active_scene->scene_type == neo::types::scene_type::ADVENTURE
    );
    int player_group = player != nullptr
      ? player->definition->collision_group : 1;

    for (int i = 0; i < actors_count; ++i)
    {
      neo::actor* actor_ = actors[i];
      int group = actor_->definition->collision_group;

      // Top-down: solid by default (group 0), unless the actor
      // explicitly joins the player's group (pass-through teammates).
      // Side-scroller: groups are opt-in, group 0 is pass-through.
      bool solid = top_down
        ? group == 0 || (group > 0 && group != player_group)
        : group > 0 && group != player_group;

      if (solid && actor_->collides(tile_x, tile_y))
      {
        return true;
      }
    }

    return false;
  }

  neo::actor* game::get_actor_by_id(bn::string_view id)
  {
    bn::string_view actor_reference = resolve_actor_reference(id);

    for (int i = 0; i < actors_count; ++i)
    {
      if (
        actors[i]->definition->name == actor_reference ||
        actors[i]->definition->_id == actor_reference
      )
      {
        return actors[i];
      }
    }

    return nullptr;
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

  void game::remove_projectile(neo::projectile* projectile)
  {
    for (int i = 0; i < projectiles_count; ++i)
    {
      if (projectiles[i] == projectile)
      {
        delete projectiles[i];
        projectiles.erase(projectiles.begin() + i);
        --projectiles_count;
        break;
      }
    }
  }
}
