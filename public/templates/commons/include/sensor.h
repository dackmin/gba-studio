#ifndef NEO_SENSOR_H
#define NEO_SENSOR_H

#include <neo_types.h>

namespace neo
{
  class game;

  class sensor
  {
    public:
      sensor(neo::game* game, neo::types::sensor* sensor_definition);

      bool is_inside(int tile_x, int tile_y);
      void trigger_enter();
      void trigger_interact();

      neo::game* game;
      neo::types::sensor* definition;
  };
}

#endif
