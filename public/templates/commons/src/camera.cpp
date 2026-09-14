#include <neo_logs.h>

#include <bn_core.h>
#include <bn_camera_ptr.h>
#include <bn_log.h>

#include <neo_types.h>

#include "game.h"

namespace neo::camera
{
  namespace
  {
    void get_bounds(
      neo::game* game,
      neo::types::scene& active_scene,
      int& min_x,
      int& max_x,
      int& min_y,
      int& max_y
    )
    {
      int bg_pixel_width, bg_pixel_height;

      // Scenes without map data (e.g. logos scenes) have no tile grid, but still
      // have a background whose pixel size can be used to derive the same
      // top-left-relative bounds as the map data branch below.
      if (active_scene.map_data != nullptr)
      {
        bg_pixel_width = active_scene.map_data->pixel_width(game->variables);
        bg_pixel_height = active_scene.map_data->pixel_height(game->variables);
      }
      else
      {
        // Butano map cells are 8px wide/tall.
        bg_pixel_width = active_scene.background.map_item().dimensions().width() * 8;
        bg_pixel_height = active_scene.background.map_item().dimensions().height() * 8;
      }

      min_x = -(bg_pixel_width / 2 - neo::types::SCREEN_WIDTH / 2);
      max_x = bg_pixel_width / 2 - neo::types::SCREEN_WIDTH / 2;
      min_y = -(bg_pixel_height / 2 - neo::types::SCREEN_HEIGHT / 2);
      max_y = bg_pixel_height / 2 - neo::types::SCREEN_HEIGHT / 2;
    }

    void animate_to(
      neo::game* game,
      int end_x,
      int end_y,
      int duration,
      bool allow_diagonal,
      bn::string_view direction_priority
    )
    {
      // 0,0 is camera center
      int start_x = (int)game->camera.x();
      int start_y = (int)game->camera.y();

      if (duration <= 0)
      {
        game->camera.set_position(end_x, end_y);
        return;
      }

      int delta_x = end_x - start_x;
      int delta_y = end_y - start_y;

      int frames = duration / 16; // Assuming 60 FPS, 16ms per frame

      // Nothing to animate (already at target, or duration too short for a frame):
      // avoid dividing by zero below and just snap to the final position.
      if (frames <= 0 || (delta_x == 0 && delta_y == 0))
      {
        game->camera.set_position(end_x, end_y);
        return;
      }

      if (allow_diagonal)
      {
        for (int frame = 0; frame <= frames; ++frame)
        {
          float t = static_cast<float>(frame) / frames;

          int new_x = start_x + static_cast<int>(delta_x * t);
          int new_y = start_y + static_cast<int>(delta_y * t);

          game->camera.set_position(new_x, new_y);

          bn::core::update();
        }
      }
      else
      {
        int horizontal_frames = frames * abs(delta_x) / (abs(delta_x) + abs(delta_y));
        int vertical_frames = frames - horizontal_frames;

        if (direction_priority == "horizontal")
        {
          // Move horizontally first
          for (int frame = 0; frame <= horizontal_frames; ++frame)
          {
            float t = horizontal_frames > 0 ? static_cast<float>(frame) / horizontal_frames : 1.0f;
            int new_x = start_x + static_cast<int>(delta_x * t);
            game->camera.set_position(new_x, start_y);
            bn::core::update();
          }
          // Then move vertically
          for (int frame = 0; frame <= vertical_frames; ++frame)
          {
            float t = vertical_frames > 0 ? static_cast<float>(frame) / vertical_frames : 1.0f;
            int new_y = start_y + static_cast<int>(delta_y * t);
            game->camera.set_position(end_x, new_y);
            bn::core::update();
          }
        } else if (direction_priority == "vertical") {
          // Move vertically first
          for (int frame = 0; frame <= vertical_frames; ++frame)
          {
            float t = vertical_frames > 0 ? static_cast<float>(frame) / vertical_frames : 1.0f;
            int new_y = start_y + static_cast<int>(delta_y * t);
            game->camera.set_position(start_x, new_y);
            bn::core::update();
          }
          // Then move horizontally
          for (int frame = 0; frame <= horizontal_frames; ++frame)
          {
            float t = horizontal_frames > 0 ? static_cast<float>(frame) / horizontal_frames : 1.0f;
            int new_x = start_x + static_cast<int>(delta_x * t);
            game->camera.set_position(new_x, end_y);
            bn::core::update();
          }
        }
      }

      game->camera.set_position(end_x, end_y);
    }
  }

  void get_move_to_target(
    neo::game* game,
    int x,
    int y,
    int& end_x,
    int& end_y
  )
  {
    int min_x, max_x, min_y, max_y;
    get_bounds(game, *game->active_scene, min_x, max_x, min_y, max_y);

    // x/y are the target pixel position of the top-left corner of the viewport.
    end_x = bn::min(bn::max(min_x + x, min_x), max_x);
    end_y = bn::min(bn::max(min_y + y, min_y), max_y);
  }

  void move_to(
    neo::game* game,
    neo::types::scene& active_scene,
    int x,
    int y,
    int duration,
    bool allow_diagonal,
    bn::string_view direction_priority
  )
  {
    int min_x, max_x, min_y, max_y;
    get_bounds(game, active_scene, min_x, max_x, min_y, max_y);

    // x/y are the target pixel position of the top-left corner of the viewport.
    int end_x = bn::min(bn::max(min_x + x, min_x), max_x);
    int end_y = bn::min(bn::max(min_y + y, min_y), max_y);

    animate_to(game, end_x, end_y, duration, allow_diagonal, direction_priority);
  }

  void follow(
    neo::game* game,
    neo::types::scene& active_scene,
    neo::actor* target,
    int duration,
    bool allow_diagonal,
    bn::string_view direction_priority
  )
  {
    if (target == nullptr)
    {
      return;
    }

    int min_x, max_x, min_y, max_y;
    get_bounds(game, active_scene, min_x, max_x, min_y, max_y);

    // The sprite's position is already in the same camera-centered coordinate space.
    int end_x = bn::min(bn::max((int)target->sprite.x(), min_x), max_x);
    int end_y = bn::min(bn::max((int)target->sprite.y(), min_y), max_y);

    animate_to(game, end_x, end_y, duration, allow_diagonal, direction_priority);
  }

  void track(
    neo::game* game,
    neo::types::scene& active_scene,
    neo::actor* target
  )
  {
    if (target == nullptr)
    {
      return;
    }

    int min_x, max_x, min_y, max_y;
    get_bounds(game, active_scene, min_x, max_x, min_y, max_y);

    int x = bn::min(bn::max((int)target->sprite.x(), min_x), max_x);
    int y = bn::min(bn::max((int)target->sprite.y(), min_y), max_y);

    game->camera.set_position(x, y);
  }
}

void neo::types::move_camera_to_event::start(neo::game* game_)
{
  game_ref = game_;
  frame = 0;
  phase = 0;

  int target_x = x->as_int(game_->variables);
  int target_y = y->as_int(game_->variables);

  neo::camera::get_move_to_target(game_, target_x, target_y, end_x, end_y);

  // 0,0 is camera center
  start_x = (int)game_->camera.x();
  start_y = (int)game_->camera.y();

  int duration_ms = duration->as_int(game_->variables);

  if (duration_ms <= 0)
  {
    game_->camera.set_position(end_x, end_y);
    frames = 0;

    return;
  }

  delta_x = end_x - start_x;
  delta_y = end_y - start_y;
  frames = duration_ms / 16; // Assuming 60 FPS, 16ms per frame

  // Nothing to animate (already at target, or duration too short for a frame):
  // avoid dividing by zero below and just snap to the final position.
  if (frames <= 0 || (delta_x == 0 && delta_y == 0))
  {
    game_->camera.set_position(end_x, end_y);
    frames = 0;

    return;
  }

  if (!allow_diagonal)
  {
    horizontal_frames = frames * abs(delta_x) / (abs(delta_x) + abs(delta_y));
    vertical_frames = frames - horizontal_frames;
  }
}

bool neo::types::move_camera_to_event::update()
{
  if (frames <= 0)
  {
    return true;
  }

  if (allow_diagonal)
  {
    frame++;

    float t = static_cast<float>(frame) / frames;

    game_ref->camera.set_position(
      start_x + static_cast<int>(delta_x * t), start_y + static_cast<int>(delta_y * t));

    if (frame < frames)
    {
      return false;
    }

    game_ref->camera.set_position(end_x, end_y);
    frames = 0;

    return true;
  }

  bool horizontal_first = direction_priority == "horizontal";
  int first_frames = horizontal_first ? horizontal_frames : vertical_frames;
  int second_frames = horizontal_first ? vertical_frames : horizontal_frames;

  if (phase == 0)
  {
    frame++;

    float t = first_frames > 0 ? static_cast<float>(frame) / first_frames : 1.0f;

    if (horizontal_first)
    {
      game_ref->camera.set_position(start_x + static_cast<int>(delta_x * t), start_y);
    }
    else
    {
      game_ref->camera.set_position(start_x, start_y + static_cast<int>(delta_y * t));
    }

    if (frame < first_frames)
    {
      return false;
    }

    phase = 1;
    frame = 0;

    if (second_frames > 0)
    {
      return false;
    }
  }

  // phase == 1
  frame++;

  float t = second_frames > 0 ? static_cast<float>(frame) / second_frames : 1.0f;

  if (horizontal_first)
  {
    game_ref->camera.set_position(end_x, start_y + static_cast<int>(delta_y * t));
  }
  else
  {
    game_ref->camera.set_position(start_x + static_cast<int>(delta_x * t), end_y);
  }

  if (frame < second_frames)
  {
    return false;
  }

  game_ref->camera.set_position(end_x, end_y);
  frames = 0;

  return true;
}

