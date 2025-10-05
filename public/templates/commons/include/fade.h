#ifndef NEO_FADE_H
#define NEO_FADE_H

#include <bn_regular_bg_ptr.h>

namespace neo::fade
{
  void enter(bn::regular_bg_ptr& bg, int duration);
  void exit(bn::regular_bg_ptr& bg, int duration);
}

#endif
