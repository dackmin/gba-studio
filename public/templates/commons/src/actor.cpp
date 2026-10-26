#include <neo_logs.h>

#include <bn_core.h>
#include <bn_keypad.h>
#include <bn_sprite_ptr.h>
#include <bn_log.h>
#include <bn_math.h>

#include <neo_types.h>

#include "actor.h"
#include "game.h"
#include "camera.h"
#include "commons.h"

namespace neo
{
  actor::actor(
    neo::game* game_,
    const neo::types::actor* actor_definition_,
    bool is_player_
  ) : game(game_),
      definition(actor_definition_),
      sprite(definition->sprite.create_sprite(0, 0)),
      position(0, 0),
      moving(false),
      is_player(is_player_)
  {
    sprite.set_camera(game->camera);
    sprite.set_visible(true);
    sprite.set_bg_priority(1);
    sprite.set_z_order(actor_definition_->z->as_int(game->variables));

    set_direction(definition->direction);

    if (is_player)
    {
      const neo::types::map* map_data = game->active_scene->map_data;
      int grid_size = map_data->grid_size->as_int(game->variables);
      int tile_x = definition->x->as_int(game->variables);
      int tile_y = definition->y->as_int(game->variables);
      int px = tile_x * grid_size;
      int py = tile_y * grid_size;
      set_position(bn::fixed_point(px, py));
    }
    else
    {
      set_position(definition->x->as_int(game->variables), definition->y->as_int(game->variables));
    }
  }

  actor::~actor()
  {
    sprite.set_visible(false);
  }

  bn::sprite_tiles_ptr actor::get_direction_tiles(const bn::sprite_tiles_item& item, int index)
  {
    return item.create_tiles(index < item.graphics_count() ? index : 0);
  }

  void actor::set_direction (neo::types::direction direction_)
  {
    if (!sprite.visible())
    {
      return;
    }

    if (direction_ == neo::types::direction::PLAYER)
    {
      if (game->player != nullptr)
      {
        int delta_x = int(game->player->sprite.x() - sprite.x());
        int delta_y = int(game->player->sprite.y() - sprite.y());

        if (delta_x == 0 && delta_y == 0)
        {
          direction = game->player->opposite_direction();
        }
        else if (abs(delta_x) >= abs(delta_y))
        {
          direction = delta_x >= 0 ? neo::types::direction::RIGHT : neo::types::direction::LEFT;
        }
        else
        {
          direction = delta_y >= 0 ? neo::types::direction::DOWN : neo::types::direction::UP;
        }
      }
      else
      {
        direction = neo::types::direction::DOWN;
      }
    }
    else
    {
      direction = direction_;
    }

    if (direction == neo::types::direction::LEFT)
    {
      sprite.set_tiles(get_direction_tiles(definition->sprite.tiles_item(), neo::tileindex::LEFT));
      sprite.set_horizontal_flip(true);
    }
    else if (direction == neo::types::direction::RIGHT)
    {
      sprite.set_tiles(get_direction_tiles(definition->sprite.tiles_item(), neo::tileindex::RIGHT));
      sprite.set_horizontal_flip(false);
    }
    else if (direction == neo::types::direction::UP)
    {
      sprite.set_tiles(get_direction_tiles(definition->sprite.tiles_item(), neo::tileindex::UP));
    }
    else
    {
      sprite.set_tiles(get_direction_tiles(definition->sprite.tiles_item(), neo::tileindex::DOWN));
    }
  }

  /**
   * Set position with tiles
   */
  void actor::set_position (int tile_x, int tile_y)
  {
    if (!sprite.visible())
    {
      return;
    }

    position = bn::fixed_point(tile_x, tile_y);

    int x = game->active_scene->map_data->to_pixel_x(game->variables, tile_x)
        - game->active_scene->map_data->pixel_width(game->variables) / 2
        + sprite.dimensions().width() / 2;
    int y = game->active_scene->map_data->to_pixel_y(game->variables, tile_y)
        - game->active_scene->map_data->pixel_height(game->variables) / 2
        + sprite.dimensions().height() / 2;

    sprite.set_x(x);
    sprite.set_y(y);
    wave_offset = 0;

    if (game->camera_target == this)
    {
      neo::camera::track(game, *game->active_scene, this);
    }
  }

  /**
   * Set position with pixels, following with the camera if this actor is the camera_target
   */
  void actor::set_position (bn::fixed_point pixel_position)
  {
    position = pixel_position;

    const neo::types::map* map_data = game->active_scene->map_data;
    int x = (int)position.x() - map_data->pixel_width(game->variables) / 2;
    int y = (int)position.y() - map_data->pixel_height(game->variables) / 2;
    sprite.set_x(x + width() / 2);
    sprite.set_y(y + height() / 2);
    wave_offset = 0;

    if (game->camera_target == this)
    {
      neo::camera::track(game, *game->active_scene, this);
    }
  }

  void actor::set_z_order(int z)
  {
    sprite.set_z_order(z);
  }

  bool actor::collides(int tile_x, int tile_y)
  {
    if (!sprite.visible())
    {
      return false;
    }

    const neo::types::map* map_data = game->active_scene->map_data;
    int grid_size = map_data->grid_size->as_int(game->variables);

    // Position is the top-left tile; the actor covers as many tiles as its sprite spans.
    int origin_tile_x = is_player
      ? map_data->to_tile_x(game->variables, (int)position.x())
      : position.x().right_shift_integer();
    int origin_tile_y = is_player
      ? map_data->to_tile_y(game->variables, (int)position.y())
      : position.y().right_shift_integer();
    int tiles_wide = bn::max(1, (width() + grid_size - 1) / grid_size);
    int tiles_high = bn::max(1, (height() + grid_size - 1) / grid_size);

    return tile_x >= origin_tile_x && tile_x < origin_tile_x + tiles_wide
      && tile_y >= origin_tile_y && tile_y < origin_tile_y + tiles_high;
  }

  void actor::trigger_collide()
  {
    for (int i = 0; i < definition->collide_events_count; ++i)
    {
      game->exec_event(definition->collide_events[i], true);
    }
  }

  void actor::trigger_hit()
  {
    for (int i = 0; i < definition->hit_events_count && !game->scene_changed; ++i)
    {
      game->exec_event(definition->hit_events[i], true);
    }
  }

  void actor::disable()
  {
    end_attack();
    sprite.set_visible(false);
    sprite.remove_camera();
  }

  void actor::enable()
  {
    sprite.set_visible(true);
    sprite.set_camera(game->camera);
  }

  void actor::init()
  {
    for (int i = 0; i < definition->init_events_count; ++i)
    {
      game->exec_event(definition->init_events[i], false);
    }
  }

  void actor::update()
  {
    if (is_player)
    {
      if (game->is_input_enabled)
      {
        check_input();
      }

      return;
    }

    for (int i = 0; i < definition->update_events_count; ++i)
    {
      game->exec_event(definition->update_events[i], true);
    }
  }

  bool actor::try_interact()
  {
    a_buffered = false;

    const neo::types::map* map_data = game->active_scene->map_data;

    neo::actor* other = game->get_actor_at(
      map_data->to_tile_x(game->variables, (int)position.x()),
      map_data->to_tile_y(game->variables, (int)position.y()),
      direction
    );

    if (other != nullptr && game->active_scene != nullptr && other->definition->interact_events != nullptr)
    {
      if (!other->definition->disable_direction_on_interact)
      {
        other->set_direction(opposite_direction());
      }
      for (int i = 0; i < other->definition->interact_events_count; i++)
      {
        game->exec_event(other->definition->interact_events[i], true);
      }

      game->update_frame();
      return true;
    }

    neo::sprite* other_sprite = game->get_sprite_at(
      map_data->to_tile_x(game->variables, (int)position.x()),
      map_data->to_tile_y(game->variables, (int)position.y()),
      direction
    );

    if (other_sprite != nullptr && game->active_scene != nullptr && other_sprite->definition->interact_events != nullptr)
    {
      for (int i = 0; i < other_sprite->definition->interact_events_count; i++)
      {
        game->exec_event(other_sprite->definition->interact_events[i], true);
      }

      game->update_frame();
      return true;
    }

    int facing_tile_x = map_data->to_tile_x(game->variables, (int)position.x());
    int facing_tile_y = map_data->to_tile_y(game->variables, (int)position.y());

    switch (direction)
    {
      case neo::types::direction::LEFT:
        facing_tile_x -= 1;
        break;
      case neo::types::direction::RIGHT:
        facing_tile_x += 1;
        break;
      case neo::types::direction::UP:
        facing_tile_y -= 1;
        break;
      default:
        facing_tile_y += 1;
        break;
    }

    neo::sensor* other_sensor = game->get_sensor_at(facing_tile_x, facing_tile_y);

    if (other_sensor != nullptr && game->active_scene != nullptr && other_sensor->definition->interact_events != nullptr)
    {
      other_sensor->trigger_interact();

      game->update_frame();
      return true;
    }

    return false;
  }

  void actor::check_input()
  {
    bn::sprite_tiles_item tiles_item = definition->sprite.tiles_item();

    if (game->active_scene->scene_type == neo::types::scene_type::SIDE_SCROLLER)
    {
      check_input_side_scroller();
      return;
    }

    if (game->active_scene->scene_type == neo::types::scene_type::POINT_AND_CLICK)
    {
      check_input_point_and_click();
      return;
    }

    if (game->active_scene->scene_type == neo::types::scene_type::ADVENTURE)
    {
      check_input_adventure();
      return;
    }

    if ((bn::keypad::a_pressed() || a_buffered) && try_interact())
    {
      return;
    }

    if (bn::keypad::left_pressed() || bn::keypad::left_held())
    {
      direction = neo::types::direction::LEFT;
      sprite.set_tiles(get_direction_tiles(tiles_item, neo::tileindex::LEFT));
      sprite.set_horizontal_flip(true);

      if (bn::keypad::left_held())
      {
        moving = true;
        neo::types::sprite_animation* anim = definition->animations_count > 0
          ? get_animation(definition->animations[0]->_id)
          : nullptr;

        if (anim != nullptr)
        {
          anim->reset(sprite, &tiles_item);
        }

        while (bn::keypad::left_held() && !game->scene_changed)
        {
          if ((bn::keypad::a_pressed() || a_buffered) && try_interact())
          {
            break;
          }

          move(anim);
        }

        moving = false;
        set_direction(direction);
      }
    }
    else if (bn::keypad::right_pressed() || bn::keypad::right_held())
    {
      direction = neo::types::direction::RIGHT;
      sprite.set_tiles(get_direction_tiles(tiles_item, neo::tileindex::RIGHT));
      sprite.set_horizontal_flip(false);

      if (bn::keypad::right_held())
      {
        moving = true;
        neo::types::sprite_animation* anim = definition->animations_count > 0
          ? get_animation(definition->animations[0]->_id)
          : nullptr;

        if (anim != nullptr)
        {
          anim->reset(sprite, &tiles_item);
        }

        while (bn::keypad::right_held() && !game->scene_changed)
        {
          if ((bn::keypad::a_pressed() || a_buffered) && try_interact())
          {
            break;
          }

          move(anim);
        }

        moving = false;
        set_direction(direction);
      }
    }

    if (bn::keypad::up_pressed() || bn::keypad::up_held())
    {
      direction = neo::types::direction::UP;
      sprite.set_tiles(get_direction_tiles(tiles_item, neo::tileindex::UP));

      if (bn::keypad::up_held())
      {
        moving = true;
        neo::types::sprite_animation* anim = definition->animations_count > 0
          ? get_animation(definition->animations[0]->_id)
          : nullptr;

        if (anim != nullptr)
        {
          anim->reset(sprite, &tiles_item);
        }

        while (bn::keypad::up_held() && !game->scene_changed)
        {
          if ((bn::keypad::a_pressed() || a_buffered) && try_interact())
          {
            break;
          }

          move(anim);
        }

        moving = false;
        set_direction(direction);
      }
    }
    else if (bn::keypad::down_pressed() || bn::keypad::down_held())
    {
      direction = neo::types::direction::DOWN;
      sprite.set_tiles(get_direction_tiles(tiles_item, neo::tileindex::DOWN));

      if (bn::keypad::down_held())
      {
        moving = true;
        neo::types::sprite_animation* anim = definition->animations_count > 0
          ? get_animation(definition->animations[0]->_id)
          : nullptr;

        if (anim != nullptr)
        {
          anim->reset(sprite, &tiles_item);
        }

        while (bn::keypad::down_held() && !game->scene_changed)
        {
          if ((bn::keypad::a_pressed() || a_buffered) && try_interact())
          {
            break;
          }

          move(anim);
        }

        moving = false;
        set_direction(direction);
      }
    }
  }

  void actor::check_input_side_scroller()
  {
    const neo::types::map* map_data = game->active_scene->map_data;
    bn::sprite_tiles_item tiles_item = definition->sprite.tiles_item();

    bool was_grounded = grounded;

    bool walk_left = bn::keypad::left_held();
    bool walk_right = bn::keypad::right_held();
    bool walking = walk_left || walk_right;

    if (bn::keypad::left_pressed())
    {
      sprite.set_tiles(get_direction_tiles(tiles_item, neo::tileindex::LEFT));
      sprite.set_horizontal_flip(true);
    }
    else if (bn::keypad::right_pressed())
    {
      sprite.set_tiles(get_direction_tiles(tiles_item, neo::tileindex::RIGHT));
      sprite.set_horizontal_flip(false);
    }

    if (walking)
    {
      direction = walk_left
        ? neo::types::direction::LEFT : neo::types::direction::RIGHT;
      moving = true;
    }
    else
    {
      moving = false;
    }

    if (walking)
    {
      int next_x = (int)position.x() +
        (walk_left ? -SIDE_SCROLL_SPEED : SIDE_SCROLL_SPEED);

      if (!side_scroller_blocked_at(next_x, (int)position.y()))
      {
        set_position(bn::fixed_point(next_x, position.y()));
      }
    }

    // A jumps when grounded (and doesn't re-trigger mid-air)
    if (bn::keypad::a_pressed() && grounded)
    {
      vertical_velocity = -SIDE_SCROLL_JUMP;
      grounded = false;
    }

    apply_side_scroller_gravity();

    if (walking)
    {
      neo::types::sprite_animation* anim = definition->animations_count > 0
        ? get_animation(definition->animations[0]->_id)
        : nullptr;

      if (grounded)
      {
        if ((!was_moving_side_scroller || !was_grounded) && anim != nullptr)
        {
          anim->reset(sprite, &tiles_item);
        }
        else if (anim != nullptr)
        {
          anim->play(sprite, &tiles_item, game->variables);
        }
      }
    }
    else if (was_moving_side_scroller)
    {
      set_direction(direction);
    }

    was_moving_side_scroller = walking;

    int tile_x = map_data->to_tile_x(game->variables, (int)position.x());
    int tile_y = map_data->to_tile_y(game->variables, (int)position.y());

    neo::sensor* sensor = game->get_sensor_at(tile_x, tile_y);

    for (int i = 0; i < game->sensors_count; ++i)
    {
      neo::sensor* other = game->sensors[i];

      if (other == sensor)
      {
        continue;
      }

      if (other->player_inside)
      {
        other->player_inside = false;

        if (other->definition->leave_events != nullptr)
        {
          other->trigger_leave();
        }
      }
    }

    if (
      sensor != nullptr &&
      sensor->definition->enter_events != nullptr &&
      !sensor->player_inside
    )
    {
      sensor->player_inside = true;
      sensor->trigger_enter();
    }

    // Actor/sprite collide events (different collision group)
    check_collisions();
  }

  void actor::walk_to(int pixel_x, int pixel_y)
  {
    if (!sprite.visible())
    {
      return;
    }

    walk_target = bn::fixed_point(pixel_x - width() / 2, pixel_y - height());

    if (game->active_scene->has_gravity)
    {
      walk_target.set_y(position.y());
    }

    int delta_x = (int)walk_target.x() - (int)position.x();
    int delta_y = (int)walk_target.y() - (int)position.y();

    if (delta_x == 0 && delta_y == 0)
    {
      return;
    }

    neo::types::direction new_direction = abs(delta_x) >= abs(delta_y)
      ? (delta_x >= 0 ? neo::types::direction::RIGHT : neo::types::direction::LEFT)
      : (delta_y >= 0 ? neo::types::direction::DOWN : neo::types::direction::UP);

    walking_to_target = true;
    moving = true;
    set_direction(new_direction);

    neo::types::sprite_animation* anim = definition->animations_count > 0
      ? get_animation(definition->animations[0]->_id)
      : nullptr;

    if (anim != nullptr)
    {
      bn::sprite_tiles_item tiles_item = definition->sprite.tiles_item();
      anim->reset(sprite, &tiles_item);
    }
  }

  void actor::stop_walking()
  {
    if (!walking_to_target)
    {
      return;
    }

    walking_to_target = false;
    moving = false;
    set_direction(direction);
  }

  bool actor::adventure_blocked_at(int pixel_x, int pixel_y)
  {
    const neo::types::map* map_data = game->active_scene->map_data;

    int sprite_width = width();
    int sprite_height = height();
    int inset = sprite_width > 8 ? 2 : 0;

    int left = pixel_x + inset;
    int right = pixel_x + sprite_width - 1 - inset;
    int top = pixel_y + sprite_height / 2;
    int bottom = pixel_y + sprite_height - 1;

    int min_tile_x = left < 0 ? -1 : map_data->to_tile_x(game->variables, left);
    int max_tile_x = right < 0 ? -1 : map_data->to_tile_x(game->variables, right);
    int min_tile_y = top < 0 ? -1 : map_data->to_tile_y(game->variables, top);
    int max_tile_y = bottom < 0 ? -1 : map_data->to_tile_y(game->variables, bottom);

    for (int tile_y = min_tile_y; tile_y <= max_tile_y; ++tile_y)
    {
      for (int tile_x = min_tile_x; tile_x <= max_tile_x; ++tile_x)
      {
        if (map_data->has_collision(tile_x, tile_y) || game->has_collision(tile_x, tile_y))
        {
          return true;
        }
      }
    }

    return false;
  }

  bool actor::interact_ahead()
  {
    int sprite_width = width();
    int sprite_height = height();
    int inset = sprite_width > 8 ? 2 : 0;
    int pixel_x = (int)position.x();
    int pixel_y = (int)position.y();
    int center_x = pixel_x + sprite_width / 2;
    int center_y = pixel_y + sprite_height * 3 / 4;

    switch (direction)
    {
      case neo::types::direction::LEFT:
        return game->interact_at(pixel_x + inset - 4, center_y);
      case neo::types::direction::RIGHT:
        return game->interact_at(pixel_x + sprite_width - 1 - inset + 4, center_y);
      case neo::types::direction::UP:
        return game->interact_at(center_x, pixel_y + sprite_height / 2 - 4);
      default:
        return game->interact_at(center_x, pixel_y + sprite_height - 1 + 4);
    }
  }

  void actor::check_input_adventure()
  {
    // The player can't move or interact while swinging the weapon
    if (attack_frames_left > 0)
    {
      update_attack();
      return;
    }

    bn::sprite_tiles_item tiles_item = definition->sprite.tiles_item();

    if (game->active_scene->has_weapon && bn::keypad::b_pressed())
    {
      start_attack();
      return;
    }

    if (bn::keypad::a_pressed() && interact_ahead())
    {
      return;
    }

    int dx = (bn::keypad::right_held() ? 1 : 0) - (bn::keypad::left_held() ? 1 : 0);
    int dy = (bn::keypad::down_held() ? 1 : 0) - (bn::keypad::up_held() ? 1 : 0);

    neo::types::direction facing = direction;

    if (dx != 0 || dy != 0)
    {
      bool facing_held =
        (facing == neo::types::direction::LEFT && dx < 0) ||
        (facing == neo::types::direction::RIGHT && dx > 0) ||
        (facing == neo::types::direction::UP && dy < 0) ||
        (facing == neo::types::direction::DOWN && dy > 0);

      if (bn::keypad::left_pressed() && dx < 0)
      {
        facing = neo::types::direction::LEFT;
      }
      else if (bn::keypad::right_pressed() && dx > 0)
      {
        facing = neo::types::direction::RIGHT;
      }
      else if (bn::keypad::up_pressed() && dy < 0)
      {
        facing = neo::types::direction::UP;
      }
      else if (bn::keypad::down_pressed() && dy > 0)
      {
        facing = neo::types::direction::DOWN;
      }
      else if (!facing_held)
      {
        facing = dx != 0
          ? (dx < 0 ? neo::types::direction::LEFT : neo::types::direction::RIGHT)
          : (dy < 0 ? neo::types::direction::UP : neo::types::direction::DOWN);
      }
    }

    bn::fixed speed = (dx != 0 && dy != 0)
      ? ADVENTURE_SPEED * bn::fixed(0.707)
      : ADVENTURE_SPEED;
    bn::fixed_point next_position = position;

    if (dx != 0 && !adventure_blocked_at((int)(next_position.x() + dx * speed), (int)next_position.y()))
    {
      next_position.set_x(next_position.x() + dx * speed);
    }

    if (dy != 0 && !adventure_blocked_at((int)next_position.x(), (int)(next_position.y() + dy * speed)))
    {
      next_position.set_y(next_position.y() + dy * speed);
    }

    bool moved = next_position != position;
    bool restart = facing != direction || moved != was_moving_adventure;

    moving = moved;

    if (restart)
    {
      set_direction(facing);
    }

    if (moved)
    {
      set_position(next_position);

      neo::types::sprite_animation* anim = definition->animations_count > 0
        ? get_animation(definition->animations[0]->_id)
        : nullptr;

      if (anim != nullptr)
      {
        if (restart)
        {
          anim->reset(sprite, &tiles_item);
        }
        else
        {
          anim->play(sprite, &tiles_item, game->variables);
        }
      }
    }

    was_moving_adventure = moved;

    update_sensors(
      game->active_scene->map_data->to_tile_x(game->variables, (int)position.x() + width() / 2),
      game->active_scene->map_data->to_tile_y(game->variables, (int)position.y() + height() * 3 / 4)
    );

    check_collisions();
  }

  void actor::start_attack()
  {
    const neo::types::scene* scene = game->active_scene;

    attack_frames_left = bn::max(1, scene->weapon_duration / 16);
    moving = false;
    was_moving_adventure = false;
    set_direction(direction);

    for (int i = 0; i < game->actors_count; ++i)
    {
      game->actors[i]->hit_this_swing = false;
    }

    bn::sprite_tiles_item tiles_item = scene->weapon.tiles_item();
    weapon_sprite = scene->weapon.create_sprite(0, 0);
    weapon_sprite->set_camera(game->camera);
    weapon_sprite->set_bg_priority(1);
    weapon_sprite->set_z_order(
      direction == neo::types::direction::UP ? sprite.z_order() + 1 : sprite.z_order() - 1);

    if (direction == neo::types::direction::LEFT)
    {
      weapon_sprite->set_tiles(get_direction_tiles(tiles_item, neo::tileindex::LEFT));
      weapon_sprite->set_horizontal_flip(true);
    }
    else if (direction == neo::types::direction::RIGHT)
    {
      weapon_sprite->set_tiles(get_direction_tiles(tiles_item, neo::tileindex::RIGHT));
    }
    else if (direction == neo::types::direction::UP)
    {
      weapon_sprite->set_tiles(get_direction_tiles(tiles_item, neo::tileindex::UP));
    }
    else
    {
      weapon_sprite->set_tiles(get_direction_tiles(tiles_item, neo::tileindex::DOWN));
    }

    update_attack();
  }

  void actor::update_attack()
  {
    if (!weapon_sprite.has_value())
    {
      attack_frames_left = 0;
      return;
    }

    const neo::types::map* map_data = game->active_scene->map_data;
    int player_width = width();
    int player_height = height();
    int weapon_width = weapon_sprite->dimensions().width();
    int weapon_height = weapon_sprite->dimensions().height();

    int center_x = (int)position.x() + player_width / 2;
    int center_y = (int)position.y() + player_height / 2;

    switch (direction)
    {
      case neo::types::direction::LEFT:
        center_x -= player_width / 2 + weapon_width / 2 - 2;
        break;
      case neo::types::direction::RIGHT:
        center_x += player_width / 2 + weapon_width / 2 - 2;
        break;
      case neo::types::direction::UP:
        center_y -= player_height / 2 + weapon_height / 2 - 2;
        break;
      default:
        center_y += player_height / 2 + weapon_height / 2 - 2;
        break;
    }

    weapon_sprite->set_position(
      center_x - map_data->pixel_width(game->variables) / 2,
      center_y - map_data->pixel_height(game->variables) / 2
    );

    int weapon_left = center_x - weapon_width / 2;
    int weapon_top = center_y - weapon_height / 2;

    for (int i = 0; i < game->actors_count && !game->scene_changed; ++i)
    {
      neo::actor* other = game->actors[i];

      if (
        other->hit_this_swing ||
        other->definition->hit_events_count == 0 ||
        !other->sprite.visible()
      )
      {
        continue;
      }

      int other_left = map_data->to_pixel_x(
        game->variables, other->position.x().right_shift_integer());
      int other_top = map_data->to_pixel_y(
        game->variables, other->position.y().right_shift_integer());

      if (
        weapon_left < other_left + other->width() &&
        weapon_left + weapon_width > other_left &&
        weapon_top < other_top + other->height() &&
        weapon_top + weapon_height > other_top
      )
      {
        other->hit_this_swing = true;
        other->trigger_hit();

        if (!weapon_sprite.has_value())
        {
          return;
        }
      }
    }

    if (game->scene_changed || --attack_frames_left <= 0)
    {
      end_attack();
    }
  }

  void actor::end_attack()
  {
    attack_frames_left = 0;
    weapon_sprite.reset();
  }

  bool actor::point_and_click_blocked_at(bn::fixed_point pixel_position)
  {
    if (game->active_scene->has_gravity)
    {
      return side_scroller_blocked_at((int)pixel_position.x(), (int)pixel_position.y());
    }

    const neo::types::map* map_data = game->active_scene->map_data;

    int feet_x = (int)pixel_position.x() + width() / 2;
    int feet_y = (int)pixel_position.y() + height() - 1;
    int tile_x = feet_x < 0 ? -1 : map_data->to_tile_x(game->variables, feet_x);
    int tile_y = feet_y < 0 ? -1 : map_data->to_tile_y(game->variables, feet_y);

    return map_data->has_collision(tile_x, tile_y) ||
      game->has_collision(tile_x, tile_y);
  }

  void actor::check_input_point_and_click()
  {
    if (!walking_to_target)
    {
      return;
    }

    bn::sprite_tiles_item tiles_item = definition->sprite.tiles_item();

    bn::fixed delta_x = walk_target.x() - position.x();
    bn::fixed delta_y = walk_target.y() - position.y();
    bn::fixed distance = bn::max(bn::abs(delta_x), bn::abs(delta_y));
    bn::fixed step_x = delta_x;
    bn::fixed step_y = delta_y;
    bool arrived = true;

    if (distance > PLAYER_SPEED)
    {
      step_x = delta_x * PLAYER_SPEED / distance;
      step_y = delta_y * PLAYER_SPEED / distance;
      arrived = false;
    }

    bn::fixed_point next_position = position + bn::fixed_point(step_x, step_y);
    bool stuck = false;

    if (!point_and_click_blocked_at(next_position))
    {
      set_position(next_position);
    }
    else
    {
      arrived = false;

      bn::fixed_point next_x_position(position.x() + step_x, position.y());
      bn::fixed_point next_y_position(position.x(), position.y() + step_y);

      if (step_x != 0 && !point_and_click_blocked_at(next_x_position))
      {
        set_position(next_x_position);
      }
      else if (step_y != 0 && !point_and_click_blocked_at(next_y_position))
      {
        set_position(next_y_position);
      }
      else
      {
        stuck = true;
      }
    }

    if (!stuck && !arrived)
    {
      neo::types::sprite_animation* anim = definition->animations_count > 0
        ? get_animation(definition->animations[0]->_id)
        : nullptr;

      if (anim != nullptr)
      {
        anim->play(sprite, &tiles_item, game->variables);
      }
    }

    update_sensors(
      game->active_scene->map_data->to_tile_x(game->variables, (int)position.x() + width() / 2),
      game->active_scene->map_data->to_tile_y(game->variables, (int)position.y() + height() - 1)
    );

    check_collisions();

    if (arrived || stuck)
    {
      stop_walking();
    }
  }

  void actor::update_sensors(int tile_x, int tile_y)
  {
    neo::sensor* sensor = game->get_sensor_at(tile_x, tile_y);

    for (int i = 0; i < game->sensors_count; ++i)
    {
      neo::sensor* other = game->sensors[i];

      if (other == sensor)
      {
        continue;
      }

      if (other->player_inside)
      {
        other->player_inside = false;

        if (other->definition->leave_events != nullptr)
        {
          other->trigger_leave();
        }
      }
    }

    if (
      sensor != nullptr &&
      sensor->definition->enter_events != nullptr &&
      !sensor->player_inside
    )
    {
      sensor->player_inside = true;
      sensor->trigger_enter();
    }
  }

  void actor::apply_side_scroller_gravity()
  {
    int step = vertical_velocity + SIDE_SCROLL_GRAVITY;

    if (step > SIDE_SCROLL_MAX_FALL)
    {
      step = SIDE_SCROLL_MAX_FALL;
    }

    int moved = 0;
    int goal = step < 0 ? -step : step;

    while (moved < goal)
    {
      int next_y = (int)position.y() + (step < 0 ? -1 : 1);

      if (side_scroller_blocked_at((int)position.x(), next_y))
      {
        break;
      }

      set_position(bn::fixed_point(position.x(), next_y));
      moved++;
    }

    if (moved < goal)
    {
      // Hit a ceiling mid-jump or the ground mid-fall (or never left it)
      vertical_velocity = 0;

      if (step > 0)
      {
        grounded = true;
      }
    }
    else
    {
      vertical_velocity = step;

      if (step > 0)
      {
        grounded = false;
      }
    }
  }

  bool actor::side_scroller_blocked_at(int pixel_x, int pixel_y)
  {
    const neo::types::map* map_data = game->active_scene->map_data;

    int sprite_width = width();
    int sprite_height = height();

    int min_tile_x = map_data->to_tile_x(game->variables, pixel_x);
    int max_tile_x = map_data->to_tile_x(game->variables, pixel_x + sprite_width - 1);
    int min_tile_y = map_data->to_tile_y(game->variables, pixel_y);
    int max_tile_y = map_data->to_tile_y(game->variables, pixel_y + sprite_height - 1);

    for (int tile_y = min_tile_y; tile_y <= max_tile_y; ++tile_y)
    {
      for (int tile_x = min_tile_x; tile_x <= max_tile_x; ++tile_x)
      {
        if (map_data->has_collision(tile_x, tile_y))
        {
          return true;
        }

        if (game->has_collision(tile_x, tile_y))
        {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Which side of a collided actor/sprite the player hit, as a direction
   * name ("up", "down", "left", "right"), so it compares directly with
   * a direction expression. Uses the two overlapping rects in map pixel
   * coordinates and picks the axis with the smallest penetration: the
   * side the player just crossed to enter the other rect. "up" means
   * the player is above it (stomp).
   */
  bn::string_view actor::get_collision_side(
    int player_left, int player_top, int player_width, int player_height,
    int other_left, int other_top, int other_width, int other_height)
  {
    // How deep the player's rect overlaps the other's on each axis
    int overlap_left = (player_left + player_width) - other_left;
    int overlap_right = other_left + other_width - player_left;
    int overlap_up = (player_top + player_height) - other_top;
    int overlap_down = other_top + other_height - player_top;

    // The smallest overlap is the axis the player entered through, so
    // it identifies the side that was hit
    int smallest = overlap_left;
    bn::string_view side = "left";

    if (overlap_right < smallest)
    {
      smallest = overlap_right;
      side = "right";
    }

    if (overlap_up < smallest)
    {
      smallest = overlap_up;
      side = "up";
    }

    if (overlap_down < smallest)
    {
      side = "down";
    }

    return side;
  }

  void actor::check_collisions()
  {
    const neo::types::map* map_data = game->active_scene->map_data;
    int player_group = definition->collision_group;

    // Solidity follows the same rule as game::has_collision(): in
    // top-down scenes group 0 (the default) is solid like it always
    // was, in side-scroller scenes group 0 is pass-through and groups
    // 1-4 are solid when different from the player's.
    bool top_down =
      game->active_scene->scene_type == neo::types::scene_type::TOP_DOWN ||
      game->active_scene->scene_type == neo::types::scene_type::POINT_AND_CLICK ||
      game->active_scene->scene_type == neo::types::scene_type::ADVENTURE;

    // Player rect, in map pixel coordinates (its position is already
    // tracked in pixels)
    int player_left = (int)position.x();
    int player_top = (int)position.y();
    int player_width = width();
    int player_height = height();

    for (int i = 0; i < game->actors_count; ++i)
    {
      neo::actor* other = game->actors[i];
      int group = other->definition->collision_group;

      bool solid = top_down
        ? group == 0 || (group > 0 && group != player_group)
        : group > 0 && group != player_group;

      if (!solid || !other->sprite.visible())
      {
        other->player_touching = false;
        continue;
      }

      // The other actor's rect, in the same pixel space (its position is
      // tracked in tiles)
      int other_left = map_data->to_pixel_x(
        game->variables, other->position.x().right_shift_integer());
      int other_top = map_data->to_pixel_y(
        game->variables, other->position.y().right_shift_integer());
      int other_width = other->width();
      int other_height = other->height();

      // Contact includes flush adjacency: solid actors block movement, so
      // the player often stops right against their surface instead of
      // overlapping it. The epsilon covers one frame of movement speed.
      constexpr int contact_epsilon = 4;

      bool touching =
        player_left < other_left + other_width + contact_epsilon &&
        player_left + player_width > other_left - contact_epsilon &&
        player_top < other_top + other_height + contact_epsilon &&
        player_top + player_height > other_top - contact_epsilon;

      if (touching && !other->player_touching)
      {
        other->player_touching = true;

        game->active_collision_side = get_collision_side(
          player_left, player_top, player_width, player_height,
          other_left, other_top, other_width, other_height);
        other->trigger_collide();
        game->active_collision_side = "";
      }
      else if (!touching)
      {
        other->player_touching = false;
      }
    }

    for (int i = 0; i < game->sprites_count; ++i)
    {
      neo::sprite* other = game->sprites[i];
      int group = other->definition->collision_group;

      // Sprites keep the strict rule in both scene types: only groups
      // 1-4 (opt-in) are solid, matching their decoration-ish role
      bool solid = group > 0 && group != player_group;

      if (!solid || !other->inner_sprite.visible())
      {
        other->player_touching = false;
        continue;
      }

      int other_left = map_data->to_pixel_x(
        game->variables, other->position.x().right_shift_integer());
      int other_top = map_data->to_pixel_y(
        game->variables, other->position.y().right_shift_integer());
      int other_width = other->inner_sprite.dimensions().width();
      int other_height = other->inner_sprite.dimensions().height();

      constexpr int contact_epsilon = 4;

      bool touching =
        player_left < other_left + other_width + contact_epsilon &&
        player_left + player_width > other_left - contact_epsilon &&
        player_top < other_top + other_height + contact_epsilon &&
        player_top + player_height > other_top - contact_epsilon;

      if (touching && !other->player_touching)
      {
        other->player_touching = true;

        game->active_collision_side = get_collision_side(
          player_left, player_top, player_width, player_height,
          other_left, other_top, other_width, other_height);
        other->trigger_collide();
        game->active_collision_side = "";
      }
      else if (!touching)
      {
        other->player_touching = false;
      }
    }
  }

  void actor::move(neo::types::sprite_animation* anim)
  {
    const neo::types::map* map_data = game->active_scene->map_data;
    bn::sprite_tiles_item tiles_item = definition->sprite.tiles_item();

    int next_x = (int)position.x();
    int next_y = (int)position.y();

    switch (direction)
    {
      case neo::types::direction::LEFT:
        next_x -= map_data->grid_size->as_int(game->variables);
        break;
      case neo::types::direction::RIGHT:
        next_x += map_data->grid_size->as_int(game->variables);
        break;
      case neo::types::direction::UP:
        next_y -= map_data->grid_size->as_int(game->variables);
        break;
      default:
        next_y += map_data->grid_size->as_int(game->variables);
        break;
    }

    int tile_x = map_data->to_tile_x(game->variables, next_x);
    int tile_y = map_data->to_tile_y(game->variables, next_y);

    if (map_data->has_collision(tile_x, tile_y) || game->has_collision(tile_x, tile_y))
    {
      game->update_projectiles();
      game->update_frame();

      return;
    }

    int delta = 0;
    bn::fixed_point pixel_position = position;

    while (delta < map_data->grid_size->as_int(game->variables))
    {
      switch (direction)
      {
        case neo::types::direction::LEFT:
          pixel_position.set_x(pixel_position.x() - PLAYER_SPEED);
          break;
        case neo::types::direction::RIGHT:
          pixel_position.set_x(pixel_position.x() + PLAYER_SPEED);
          break;
        case neo::types::direction::UP:
          pixel_position.set_y(pixel_position.y() - PLAYER_SPEED);
          break;
        default:
          pixel_position.set_y(pixel_position.y() + PLAYER_SPEED);
          break;
      }

      set_position(pixel_position);
      delta += PLAYER_SPEED;

      if (anim != nullptr)
      {
        anim->play(sprite, &tiles_item, game->variables);
      }

      game->update_projectiles();
      game->update_frame();

      if (bn::keypad::a_pressed())
      {
        a_buffered = true;
      }
    }

    neo::sensor* sensor = game->get_sensor_at(tile_x, tile_y);

    for (int i = 0; i < game->sensors_count; ++i)
    {
      neo::sensor* other = game->sensors[i];

      if (other == sensor)
      {
        continue;
      }

      // The player just left this sensor (or walked straight into another
      // one): fire its leave events once.
      if (other->player_inside)
      {
        other->player_inside = false;

        if (other->definition->leave_events != nullptr)
        {
          other->trigger_leave();
        }
      }
    }

    if (
      sensor != nullptr &&
      game->active_scene != nullptr &&
      sensor->definition->enter_events != nullptr &&
      !sensor->player_inside
    )
    {
      sensor->player_inside = true;
      sensor->trigger_enter();

      if (anim != nullptr)
      {
        anim->play(sprite, &tiles_item, game->variables);
      }

      game->update_projectiles();
      game->update_frame();

      return;
    }

    // Actor/sprite collide events (different collision group), like the
    // side-scroller branch: fired on the not-touching -> touching
    // transition of each grid step.
    check_collisions();
  }

  int actor::width()
  {
    return sprite.dimensions().width();
  }

  int actor::height()
  {
    return sprite.dimensions().height();
  }

  neo::types::direction actor::opposite_direction()
  {
    switch (direction)
    {
      case neo::types::direction::LEFT:
        return neo::types::direction::RIGHT;
      case neo::types::direction::RIGHT:
        return neo::types::direction::LEFT;
      case neo::types::direction::UP:
        return neo::types::direction::DOWN;
      default:
        return neo::types::direction::UP;
    }
  }

  void actor::move_to(int tile_x, int tile_y, int speed, bn::string_view direction_priority, bn::string_view animation, bool backwards)
  {
    if (!sprite.visible())
    {
      return;
    }

    // A scripted move takes over from any point-and-click walk
    walking_to_target = false;
    moving = true;

    const neo::types::map* map_data = game->active_scene->map_data;
    int offset_x = -map_data->pixel_width(game->variables) / 2 + sprite.dimensions().width() / 2;
    int offset_y = -map_data->pixel_height(game->variables) / 2 + sprite.dimensions().height() / 2;

    // speed is in pixels per frame, same unit as PLAYER_SPEED
    int px_per_frame = bn::max(1, speed);

    int origin_x = (int)sprite.x();
    int origin_y = (int)sprite.y();
    int target_x = map_data->to_pixel_x(game->variables, tile_x) + offset_x;
    int target_y = map_data->to_pixel_y(game->variables, tile_y) + offset_y;

    int delta_x = target_x - origin_x;
    int delta_y = target_y - origin_y;
    bool horizontal_first = direction_priority != "vertical";
    bn::sprite_tiles_item tiles_item = definition->sprite.tiles_item();

    // Move one axis at a time, one grid step at a time, updating the sprite every frame
    for (int pass = 0; pass < 2 && !game->scene_changed; ++pass)
    {
      bool is_horizontal_pass = (pass == 0) == horizontal_first;
      int delta = is_horizontal_pass ? delta_x : delta_y;

      if (delta == 0)
      {
        continue;
      }

      // Backwards movement keeps the current facing instead of turning towards the target
      if (!backwards)
      {
        set_direction(is_horizontal_pass
          ? (delta > 0 ? neo::types::direction::RIGHT : neo::types::direction::LEFT)
          : (delta > 0 ? neo::types::direction::DOWN : neo::types::direction::UP));
      }

      // Animation depends on the (possibly just changed) direction, so it's looked up per pass
      neo::types::sprite_animation* anim = animation != "" ? get_animation(animation) : nullptr;

      if (anim != nullptr)
      {
        anim->reset(sprite, &tiles_item);
      }

      int step = delta > 0 ? px_per_frame : -px_per_frame;
      int moved = 0;

      while (abs(moved) < abs(delta) && !game->scene_changed)
      {
        moved += step;

        if (abs(moved) > abs(delta))
        {
          moved = delta;
        }

        if (is_horizontal_pass)
        {
          sprite.set_x(origin_x + moved);
        }
        else
        {
          sprite.set_y(origin_y + moved);
        }

        if (game->camera_target == this)
        {
          neo::camera::track(game, *game->active_scene, this);
        }

        // Play one animation frame
        if (anim != nullptr)
        {
          anim->play(sprite, &tiles_item, game->variables);
        }

        game->update_frame();
      }

      if (is_horizontal_pass)
      {
        origin_x = target_x;
      }
      else
      {
        origin_y = target_y;
      }
    }

    moving = false;

    if (game->scene_changed)
    {
      return;
    }

    set_direction(direction); // restore the idle tile for the final facing direction
    set_tile_position(tile_x, tile_y);
  }

  void actor::set_tile_position (int tile_x, int tile_y)
  {
    // The player's `position` is tracked in pixels (continuous movement), while
    // regular actors track it in tiles, so each needs its matching overload here.
    if (is_player)
    {
      const neo::types::map* map_data = game->active_scene->map_data;

      set_position(bn::fixed_point(
        map_data->to_pixel_x(game->variables, tile_x),
        map_data->to_pixel_y(game->variables, tile_y)
      ));
    }
    else
    {
      set_position(tile_x, tile_y);
    }
  }

  neo::types::sprite_animation* actor::get_animation (bn::string_view id)
  {
    for (int i = 0; i < definition->animations_count; i++)
    {
      neo::types::sprite_animation* animation = definition->animations[i];

      if (animation->_id == id && animation->direction == direction && animation->moving == moving)
      {
        return animation;
      }
    }

    return nullptr;
  }
}

void neo::types::actor_move_event::arm_pass()
{
  // Runs when the previous axis is done (or right at the start) to pick
  // the next axis to move along, face it and (re)reset the animation,
  // exactly like the body of each pass in actor::move_to().
  while (pass < 2)
  {
    bool horizontal_first = direction_priority != "vertical";
    horizontal_pass = (pass == 0) == horizontal_first;
    int delta = horizontal_pass ? (target_px_x - origin_x) : (target_px_y - origin_y);

    if (delta == 0)
    {
      // Nothing to move on this axis: settle it like the blocking
      // version does at the end of each pass, and try the other one.
      if (horizontal_pass)
      {
        origin_x = target_px_x;
      }
      else
      {
        origin_y = target_px_y;
      }

      ++pass;

      continue;
    }

    // Backwards movement keeps the current facing instead of turning towards the target
    if (!backwards)
    {
      target->set_direction(horizontal_pass
        ? (delta > 0 ? neo::types::direction::RIGHT : neo::types::direction::LEFT)
        : (delta > 0 ? neo::types::direction::DOWN : neo::types::direction::UP));
    }

    // Animation depends on the (possibly just changed) direction, so it's looked up per pass
    anim = animation != "" ? target->get_animation(animation) : nullptr;

    if (anim != nullptr)
    {
      bn::sprite_tiles_item tiles_item = target->definition->sprite.tiles_item();
      anim->reset(target->sprite, &tiles_item);
    }

    moved = 0;
    step = delta > 0 ? px_per_frame : -px_per_frame;
    armed = true;

    return;
  }

  // No axis left to move: finish like the blocking version's tail.
  finish();
}

void neo::types::actor_move_event::finish()
{
  target->moving = false;
  target->set_direction(target->direction); // restore the idle tile for the final facing direction
  target->set_tile_position(target_tile_x, target_tile_y);

  pass = 2;
  armed = false;
  anim = nullptr;
}

void neo::types::actor_move_event::begin_move(neo::game* game_)
{
  game_ref = game_;
  pass = 2;
  armed = false;
  anim = nullptr;

  if (target == nullptr || !target->sprite.visible())
  {
    // Like actor::move_to(): the move is skipped entirely for missing
    // or invisible (disabled) actors, so the parallel branch shouldn't
    // animate either.
    target = nullptr;

    return;
  }

  if (game_->active_scene == nullptr || game_->active_scene->map_data == nullptr)
  {
    target = nullptr;

    return;
  }

  const neo::types::map* map_data = game_->active_scene->map_data;
  int offset_x = -map_data->pixel_width(game_->variables) / 2 + target->sprite.dimensions().width() / 2;
  int offset_y = -map_data->pixel_height(game_->variables) / 2 + target->sprite.dimensions().height() / 2;

  target_tile_x = x->as_int(game_->variables);
  target_tile_y = y->as_int(game_->variables);
  target_px_x = map_data->to_pixel_x(game_->variables, target_tile_x) + offset_x;
  target_px_y = map_data->to_pixel_y(game_->variables, target_tile_y) + offset_y;

  px_per_frame = bn::max(1, speed->as_int(game_->variables));

  origin_x = (int)target->sprite.x();
  origin_y = (int)target->sprite.y();

  target->moving = true;
  pass = 0;
  arm_pass();
}

void neo::types::move_actor_to_event::start(neo::game* game_)
{
  target = nullptr;
  bn::string_view actor_reference = game_->resolve_actor_reference(actor);

  // Like the blocking handler: resolve the actor by name or id.
  for (int i = 0; i < game_->actors_count; ++i)
  {
    if (
      game_->actors[i]->definition->name == actor_reference ||
      game_->actors[i]->definition->_id == actor_reference
    )
    {
      target = game_->actors[i];

      break;
    }
  }

  begin_move(game_);
}

void neo::types::move_player_to_event::start(neo::game* game_)
{
  // Like the blocking handler: the move is skipped when there's no player.
  target = game_->player;

  begin_move(game_);
}

bool neo::types::actor_move_event::update()
{
  if (pass >= 2)
  {
    return true;
  }

  if (!armed)
  {
    arm_pass();

    if (pass >= 2)
    {
      return true;
    }
  }

  int delta = horizontal_pass ? (target_px_x - origin_x) : (target_px_y - origin_y);
  moved += step;

  if (abs(moved) > abs(delta))
  {
    moved = delta;
  }

  if (horizontal_pass)
  {
    target->sprite.set_x(origin_x + moved);
  }
  else
  {
    target->sprite.set_y(origin_y + moved);
  }

  if (game_ref->camera_target == target)
  {
    neo::camera::track(game_ref, *game_ref->active_scene, target);
  }

  // Play one animation frame
  if (anim != nullptr)
  {
    bn::sprite_tiles_item tiles_item = target->definition->sprite.tiles_item();
    anim->play(target->sprite, &tiles_item, game_ref->variables);
  }

  if (abs(moved) < abs(delta))
  {
    return false;
  }

  // Axis settled: the other one starts on the next update() call.
  if (horizontal_pass)
  {
    origin_x = target_px_x;
  }
  else
  {
    origin_y = target_px_y;
  }

  ++pass;
  armed = false;
  anim = nullptr;

  if (pass >= 2)
  {
    finish();

    return true;
  }

  return false;
}

