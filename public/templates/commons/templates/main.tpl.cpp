#include <bn_core.h>
#include <bn_camera_actions.h>

#include <neo_variables.h>

#include "{{includesPath}}/player.h"
#include "{{includesPath}}/game.h"

int main()
{
  bn::core::init();

  bn::camera_ptr camera = bn::camera_ptr::create(0, 0);
  neo::player player;
  neo::game game(camera, player);

  player.set_game(game);

  while (true)
  {
    game.run();
    bn::core::update();
  }
}
