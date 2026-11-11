#include <neo_logs.h>

#include <bn_core.h>
#include <bn_bg_palettes.h>
#include <bn_colors.h>
#include <bn_camera_actions.h>

#include <neo_variables.h>

#include "game.h"

int main()
{
  bn::core::init();

  bn::bg_palettes::set_transparent_color(bn::colors::black);

  bn::camera_ptr camera = bn::camera_ptr::create(0, 0);
  neo::game game(camera);

  while (true)
  {
    game.run();
    bn::core::update();
  }
}
