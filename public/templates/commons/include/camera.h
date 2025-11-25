#ifndef NEO_CAMERA_H
#define NEO_CAMERA_H

#include <bn_camera_ptr.h>

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
  );
}

#endif
