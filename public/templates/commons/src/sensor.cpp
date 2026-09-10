#include <neo_types.h>

#include "sensor.h"
#include "game.h"

namespace neo
{
  sensor::sensor(
    neo::game* game_,
    neo::types::sensor* sensor_definition_
  ): game(game_),
      definition(sensor_definition_)
  {}

  bool sensor::is_inside(int tile_x, int tile_y)
  {
    return definition->is_inside(tile_x, tile_y);
  }

  void sensor::trigger_enter()
  {
    for (int i = 0; i < definition->enter_events_count; ++i)
    {
      game->exec_event(definition->enter_events[i], true);
    }
  }

  void sensor::trigger_interact()
  {
    for (int i = 0; i < definition->interact_events_count; ++i)
    {
      game->exec_event(definition->interact_events[i], true);
    }
  }
}
