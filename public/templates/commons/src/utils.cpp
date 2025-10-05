#include <bn_core.h>

namespace neo::utils
{
  void wait(int milliseconds)
  {
    int frames = milliseconds / 16; // Assuming 60 FPS, 16ms per frame
    for (int i = 0; i < frames; ++i)
    {
      bn::core::update();
    }
  }
}
