#define BN_CFG_LOG_ENABLED true

#include <bn_core.h>
#include <bn_camera_ptr.h>
#include <bn_log.h>

#include <neo_types.h>

#include "game.h"

namespace neo::camera
{
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
    int min_x = -(active_scene.map_data->pixel_width(game->variables) / 2 - neo::types::SCREEN_WIDTH / 2);
    int max_x = active_scene.map_data->pixel_width(game->variables) / 2 - neo::types::SCREEN_WIDTH / 2;
    int min_y = -(active_scene.map_data->pixel_height(game->variables) / 2 - neo::types::SCREEN_HEIGHT / 2);
    int max_y = active_scene.map_data->pixel_height(game->variables) / 2 - neo::types::SCREEN_HEIGHT / 2;

    // 0,0 is camera center
    int start_x = (int)game->camera.x();
    int start_y = (int)game->camera.y();
    int target_x = min_x + active_scene.map_data->to_pixel_x(game->variables, x);
    int target_y = min_y + active_scene.map_data->to_pixel_y(game->variables, y);

    int end_x = bn::min(bn::max(target_x, min_x), max_x);
    int end_y = bn::min(bn::max(target_y, min_y), max_y);

    if (duration <= 0)
    {
      game->camera.set_position(end_x, end_y);
      return;
    }

    int delta_x = end_x - start_x;
    int delta_y = end_y - start_y;

    int frames = duration / 16; // Assuming 60 FPS, 16ms per frame

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
          float t = static_cast<float>(frame) / horizontal_frames;
          int new_x = start_x + static_cast<int>(delta_x * t);
          game->camera.set_position(new_x, start_y);
          bn::core::update();
        }
        // Then move vertically
        for (int frame = 0; frame <= vertical_frames; ++frame)
        {
          float t = static_cast<float>(frame) / vertical_frames;
          int new_y = start_y + static_cast<int>(delta_y * t);
          game->camera.set_position(end_x, new_y);
          bn::core::update();
        }
      } else if (direction_priority == "vertical") {
        // Move vertically first
        for (int frame = 0; frame <= vertical_frames; ++frame)
        {
          float t = static_cast<float>(frame) / vertical_frames;
          int new_y = start_y + static_cast<int>(delta_y * t);
          game->camera.set_position(start_x, new_y);
          bn::core::update();
        }
        // Then move horizontally
        for (int frame = 0; frame <= horizontal_frames; ++frame)
        {
          float t = static_cast<float>(frame) / horizontal_frames;
          int new_x = start_x + static_cast<int>(delta_x * t);
          game->camera.set_position(new_x, end_y);
          bn::core::update();
        }
      }
    }

    game->camera.set_position(end_x, end_y);
  }
}
