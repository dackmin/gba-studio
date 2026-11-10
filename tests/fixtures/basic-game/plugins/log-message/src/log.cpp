#include <bn_log.h>
#include <bn_span.h>
#include <bn_string_view.h>
#include <neo_types.h>

#include "game.h"
#include "dialog.h"

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

    const bn::string_view lines[] = { e->as_string(game->variables, "message") };
    neo::dialog dialog(game, bn::span<const bn::string_view>(lines));
    dialog.set_portrait(
      e->as_sprite("sprite"),
      neo::types::dialog_portrait_position::LEFT
    );
    dialog.show();
  }
}
