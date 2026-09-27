#ifndef NEO_EVENTS_H
#define NEO_EVENTS_H

#include <neo_types.h>

namespace neo
{
  class game;
}

namespace neo::events
{
  void exec_event(neo::game* game, const neo::types::event* e, bool is_loop);
  void update_scripted_events(neo::game* game);
  void update_active_parallel_events(neo::game* game);
}

#endif
