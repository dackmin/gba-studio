#include <bn_core.h>
#include <bn_blending_actions.h>
#include <bn_regular_bg_ptr.h>

namespace neo::fade
{
  void enter(bn::regular_bg_ptr& bg, int duration)
  {
    bn::blending::set_fade_alpha(1);
    bn::blending::set_black_fade_color();
    bg.set_blending_enabled(true);
    bg.set_visible(true);
    int frames = duration / 16;  // Assuming 60 FPS, 16ms per frame
    bn::blending_fade_alpha_to_action action(frames, 0);

    while (!action.done())
    {
      action.update();
      bn::core::update();
    }

    bn::blending::set_fade_alpha(0);
    bg.set_blending_enabled(false);
  }

  void exit(bn::regular_bg_ptr& bg, int duration)
  {
    bn::blending::set_fade_alpha(0);
    bn::blending::set_black_fade_color();
    bg.set_blending_enabled(true);
    int frames = duration / 16;  // Assuming 60 FPS, 16ms per frame
    bn::blending_fade_alpha_to_action action(frames, 1);

    while (!action.done())
    {
      action.update();
      bn::core::update();
    }

    bn::blending::set_fade_alpha(1);
    bg.set_blending_enabled(false);
    bg.set_visible(false);
  }
}
