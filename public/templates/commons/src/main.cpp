#include <bn_core.h>
#include <bn_camera_actions.h>

#include <neo_variables.h>

#include "game.h"

int main()
{
  bn::core::init();

  bn::camera_ptr camera = bn::camera_ptr::create(0, 0);
  neo::game game(camera);

  while (true)
  {
    game.run();
    bn::core::update();
  }
}
