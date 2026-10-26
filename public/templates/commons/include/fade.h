#ifndef NEO_FADE_H
#define NEO_FADE_H

#include "game.h"
#include "scene_bg.h"

namespace neo::fade
{
  void enter(neo::game* game, neo::scene_bg& bg, int duration);
  void exit(neo::game* game, neo::scene_bg& bg, int duration);
}

#endif
