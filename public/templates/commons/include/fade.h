#ifndef NEO_FADE_H
#define NEO_FADE_H

#include <bn_regular_bg_ptr.h>

#include "game.h"

namespace neo::fade
{
  void enter(neo::game* game, bn::regular_bg_ptr& bg, int duration);
  void exit(neo::game* game, bn::regular_bg_ptr& bg, int duration);
}

#endif
