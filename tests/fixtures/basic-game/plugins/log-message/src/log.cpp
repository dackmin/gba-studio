#include <bn_log.h>
#include "game.h"
#include <neo_types.h>

#include "log.h"

namespace log_message
{
  void log(neo::game* game, const neo::types::plugin_event* e)
  {
    const int count = e->as_int(game->variables, "count", 1);

    for (int i = 0; i < count; ++i)
    {
      BN_LOG(
        e->as_string(game->variables, "level", "info"), ": ",
        e->as_string(game->variables, "message"),
        e->as_bool(game->variables, "loud") ? "!" : ""
      );
    }
  }
}
