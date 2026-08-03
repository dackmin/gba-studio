#ifndef NEO_UTILS_H
#define NEO_UTILS_H

#include <bn_core.h>

namespace neo::utils
{
  inline void wait(int milliseconds)
  {
    int frames = milliseconds / 16; // Assuming 60 FPS, 16ms per frame
    for (int i = 0; i < frames; ++i)
    {
      bn::core::update();
    }
  }
}

#endif // NEO_UTILS_H
