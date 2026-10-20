#include <neo_logs.h>

#include <bn_core.h>
#include <bn_math.h>

#include "projectile.h"
#include "game.h"
#include "actor.h"
#include "sprite.h"

namespace neo
{
  projectile::projectile(
    neo::game* game_,
    const neo::types::shoot_projectile_event* definition_
  ) : game(game_),
      definition(definition_),
      actor(nullptr),
      sprite(definition_->sprite.create_sprite(0, 0)),
      lifetime(0),
      position(0, 0),
      heading(1, 0),
      velocity(0, 0)
  {
    if (definition->source_type == "player")
    {
      actor = game->player;
    }
    else
    {
      actor = game->get_actor_by_id(definition->actor);
    }

    sprite.set_camera(game->camera);
    sprite.set_bg_priority(1);

    if (actor != nullptr)
    {
      position = bn::fixed_point(actor->sprite.x(), actor->sprite.y());
      sprite.set_z_order(actor->sprite.z_order());
    }

    heading = direction_to_heading(resolve_direction());

    // Arc
    if (
      gravity_enabled() &&
      definition->gravity_style == neo::types::gravity_style::ARC
    )
    {
      heading = bn::fixed_point(
        bn::degrees_lut_cos(ARC_ANGLE) * horizontal_side(),
        -bn::degrees_lut_sin(ARC_ANGLE)
      );
    }

    velocity = heading * definition->speed->as_int(game->variables);

    sprite.set_horizontal_flip(heading.x() < 0);
    sprite.set_position(position);
    sprite.set_visible(true);
  }

  void projectile::update()
  {
    ++lifetime;

    if (lifetime > definition->lifetime->as_int(game->variables))
    {
      game->remove_projectile(this);

      return;
    }

    if (game->active_scene == nullptr)
    {
      return;
    }

    bool alive = true;

    if (gravity_enabled())
    {
      alive = move_with_gravity();
    }
    else
    {
      alive = move();
    }

    if (alive)
    {
      alive = check_collisions();
    }

    if (!alive)
    {
      game->remove_projectile(this);
    }
  }

  bool projectile::move_with_gravity()
  {
    switch (definition->gravity_style)
    {
      case neo::types::gravity_style::SINUS:
        return move_bouncing();
      case neo::types::gravity_style::ARC:
        return move_arc();
      case neo::types::gravity_style::CUSTOM:
        return move_custom();
      default:
        return move();
    }
  }

  /**
   * User-defined gravity: pulled each frame by `gravity` pixels per frame
   * squared towards `gravity_angle` (degrees, clockwise from the right:
   * 90 = down, 270 = up), until moving at `terminal_velocity` pixels per
   * frame in that direction (0 = no limit). Touching the map destroys it.
   */
  bool projectile::move_custom()
  {
    int angle = definition->gravity_angle->as_int(game->variables) % 360;

    if (angle < 0)
    {
      angle += 360;
    }

    bn::fixed_point direction(
      bn::degrees_lut_cos(angle),
      bn::degrees_lut_sin(angle)
    );

    velocity += direction * definition->gravity->as_fixed(game->variables);

    bn::fixed terminal_velocity = definition->terminal_velocity->as_fixed(game->variables);

    // Only cap the speed along the gravity, the rest of the throw is kept
    if (terminal_velocity > 0)
    {
      bn::fixed along = velocity.x() * direction.x() + velocity.y() * direction.y();
      bn::fixed excess = along - terminal_velocity;

      if (excess > 0)
      {
        velocity -= direction * excess;
      }
    }

    bn::fixed_point next = position + velocity;
    int x = position.x().floor_integer();
    int y = position.y().floor_integer();
    int target_x = next.x().floor_integer();
    int target_y = next.y().floor_integer();
    int step_x = target_x > x ? 1 : -1;
    int step_y = target_y > y ? 1 : -1;

    while (x != target_x)
    {
      if (blocked_at(x + step_x, y))
      {
        return false;
      }

      x += step_x;
    }

    while (y != target_y)
    {
      if (blocked_at(x, y + step_y))
      {
        return false;
      }

      y += step_y;
    }

    position = next;
    sprite.set_position(position);

    return true;
  }

  bool projectile::move()
  {
    if (gravity_enabled())
    {
      velocity.set_y(bn::min(velocity.y() + NORMAL_GRAVITY, NORMAL_MAX_FALL));
    }

    bn::fixed_point next = position + velocity;
    int x = position.x().floor_integer();
    int y = position.y().floor_integer();
    int target_x = next.x().floor_integer();
    int target_y = next.y().floor_integer();
    int step_x = target_x > x ? 1 : -1;
    int step_y = target_y > y ? 1 : -1;

    while (x != target_x)
    {
      if (blocked_at(x + step_x, y))
      {
        return false;
      }

      x += step_x;
    }

    while (y != target_y)
    {
      if (blocked_at(x, y + step_y))
      {
        return false;
      }

      y += step_y;
    }

    position = next;
    sprite.set_position(position);

    return true;
  }

  // Grenade style
  bool projectile::move_arc()
  {
    velocity.set_y(bn::min(velocity.y() + ARC_GRAVITY, ARC_MAX_FALL));

    bn::fixed_point next = position + velocity;
    int x = position.x().floor_integer();
    int y = position.y().floor_integer();
    int target_x = next.x().floor_integer();
    int target_y = next.y().floor_integer();
    int step_x = target_x > x ? 1 : -1;
    int step_y = target_y > y ? 1 : -1;

    while (x != target_x)
    {
      if (blocked_at(x + step_x, y))
      {
        return false;
      }

      x += step_x;
    }

    while (y != target_y)
    {
      if (blocked_at(x, y + step_y))
      {
        return false;
      }

      y += step_y;
    }

    position = next;
    sprite.set_position(position);

    return true;
  }

  // Mario fireball style
  bool projectile::move_bouncing()
  {
    int step_x = horizontal_side();

    sprite.set_horizontal_flip(step_x < 0);

    int x = position.x().round_integer();
    int y = position.y().floor_integer();

    int speed = definition->speed->as_int(game->variables);

    for (int moved = 0; moved < speed; ++moved)
    {
      if (blocked_at(x + step_x, y))
      {
        return false;
      }

      x += step_x;
    }

    velocity.set_y(bn::min(velocity.y() + SINUS_GRAVITY, SINUS_MAX_FALL));

    bn::fixed next_y = position.y() + velocity.y();
    int target_y = next_y.floor_integer();
    int step_y = target_y > y ? 1 : -1;

    while (y != target_y)
    {
      if (blocked_at(x, y + step_y))
      {
        velocity.set_y(step_y > 0 ? -SINUS_BOUNCE_VELOCITY : bn::fixed(0));
        next_y = y;
        break;
      }

      y += step_y;
    }

    position = bn::fixed_point(x, next_y);
    sprite.set_position(position);

    return true;
  }

  bool projectile::check_collisions()
  {
    int group = definition->collision_group;

    // Player
    if (game->player != nullptr)
    {
      neo::actor* other = game->player;
      bool touching = touching_player;
      bool alive = touch(
        other,
        other->sprite,
        other != actor && other->definition->collision_group != group,
        touching
      );

      touching_player = touching;

      if (!alive)
      {
        return false;
      }
    }

    // Actors
    for (int i = 0; i < game->actors_count && !game->scene_changed; ++i)
    {
      neo::actor* other = game->actors[i];
      unsigned bit = 1u << i;
      bool touching = touching_actors & bit;
      bool alive = touch(
        other,
        other->sprite,
        other != actor && other->definition->collision_group != group,
        touching
      );

      touching_actors = touching ? touching_actors | bit : touching_actors & ~bit;

      if (!alive)
      {
        return false;
      }
    }

    // Sprites
    for (int i = 0; i < game->sprites_count && !game->scene_changed; ++i)
    {
      neo::sprite* other = game->sprites[i];
      int other_group = other->definition->collision_group;
      uint64_t bit = uint64_t(1) << i;
      bool touching = touching_sprites & bit;
      bool alive = touch(
        other,
        other->inner_sprite,
        other_group > 0 && other_group != group,
        touching
      );

      touching_sprites = touching ? touching_sprites | bit : touching_sprites & ~bit;

      if (!alive)
      {
        return false;
      }
    }

    return true;
  }

  template<typename Target>
  bool projectile::touch(
    Target* other,
    const bn::sprite_ptr& other_sprite,
    bool can_collide,
    bool& touching
  )
  {
    if (!can_collide || !other_sprite.visible())
    {
      touching = false;
      return true;
    }

    int width = sprite.dimensions().width();
    int height = sprite.dimensions().height();
    int left = sprite.x().round_integer() - width / 2;
    int top = sprite.y().round_integer() - height / 2;

    int other_width = other_sprite.dimensions().width();
    int other_height = other_sprite.dimensions().height();
    int other_left = other_sprite.x().round_integer() - other_width / 2;
    int other_top = other_sprite.y().round_integer() - other_height / 2;

    bool overlaps = left < other_left + other_width &&
      left + width > other_left &&
      top < other_top + other_height &&
      top + height > other_top;

    if (!overlaps)
    {
      touching = false;
      return true;
    }

    if (touching)
    {
      return true;
    }

    touching = true;

    game->active_collision_side = neo::actor::get_collision_side(
      left, top, width, height,
      other_left, other_top, other_width, other_height
    );

    other->trigger_collide();
    game->active_collision_side = "";

    return !definition->destroy_on_collision;
  }

  bool projectile::blocked_at(int x, int y)
  {
    const neo::types::map* map_data = game->active_scene->map_data;

    if (map_data == nullptr)
    {
      return false;
    }

    int sprite_width = sprite.dimensions().width();
    int sprite_height = sprite.dimensions().height();
    int left = x + map_data->pixel_width(game->variables) / 2 - sprite_width / 2;
    int top = y + map_data->pixel_height(game->variables) / 2 - sprite_height / 2;

    if (left < 0 || top < 0)
    {
      return true;
    }

    int min_tile_x = map_data->to_tile_x(game->variables, left);
    int max_tile_x = map_data->to_tile_x(game->variables, left + sprite_width - 1);
    int min_tile_y = map_data->to_tile_y(game->variables, top);
    int max_tile_y = map_data->to_tile_y(game->variables, top + sprite_height - 1);

    for (int tile_y = min_tile_y; tile_y <= max_tile_y; ++tile_y)
    {
      for (int tile_x = min_tile_x; tile_x <= max_tile_x; ++tile_x)
      {
        if (map_data->has_collision(tile_x, tile_y))
        {
          return true;
        }
      }
    }

    return false;
  }

  bool projectile::gravity_enabled()
  {
    return definition->has_gravity &&
      game->active_scene != nullptr &&
      game->active_scene->scene_type == neo::types::scene_type::SIDE_SCROLLER;
  }

  int projectile::horizontal_side()
  {
    if (heading.x() != 0)
    {
      return heading.x() < 0 ? -1 : 1;
    }

    return actor != nullptr && actor->direction == neo::types::direction::LEFT
      ? -1
      : 1;
  }

  neo::types::direction projectile::resolve_direction()
  {
    neo::types::direction direction = definition->direction;
    neo::types::direction fallback = actor != nullptr
      ? actor->direction
      : neo::types::direction::RIGHT;

    if (
      direction != neo::types::direction::TOWARDS_PLAYER &&
      direction != neo::types::direction::PLAYER &&
      direction != neo::types::direction::FROM_PLAYER
    )
    {
      return direction;
    }

    neo::actor* player = game->player;

    if (player == nullptr || actor == nullptr || actor == player)
    {
      return fallback;
    }

    int delta_x = int(player->sprite.x() - actor->sprite.x());
    int delta_y = int(player->sprite.y() - actor->sprite.y());

    if (delta_x == 0 && delta_y == 0)
    {
      return fallback;
    }

    bool towards = direction != neo::types::direction::FROM_PLAYER;

    if (bn::abs(delta_x) >= bn::abs(delta_y))
    {
      return (delta_x >= 0) == towards
        ? neo::types::direction::RIGHT
        : neo::types::direction::LEFT;
    }

    return (delta_y >= 0) == towards
      ? neo::types::direction::DOWN
      : neo::types::direction::UP;
  }

  bn::fixed_point projectile::direction_to_heading(neo::types::direction direction)
  {
    constexpr bn::fixed diagonal = 0.7071;

    switch (direction)
    {
      case neo::types::direction::LEFT:
        return bn::fixed_point(-1, 0);
      case neo::types::direction::UP:
        return bn::fixed_point(0, -1);
      case neo::types::direction::DOWN:
        return bn::fixed_point(0, 1);
      case neo::types::direction::UP_LEFT:
        return bn::fixed_point(-diagonal, -diagonal);
      case neo::types::direction::UP_RIGHT:
        return bn::fixed_point(diagonal, -diagonal);
      case neo::types::direction::DOWN_LEFT:
        return bn::fixed_point(-diagonal, diagonal);
      case neo::types::direction::DOWN_RIGHT:
        return bn::fixed_point(diagonal, diagonal);
      default:
        return bn::fixed_point(1, 0);
    }
  }

  projectile::~projectile()
  {
    sprite.set_visible(false);
  }
}
