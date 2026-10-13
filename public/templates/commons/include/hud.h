#ifndef NEO_HUD_H
#define NEO_HUD_H

#include <bn_string_view.h>

#include <neo_types.h>

namespace neo
{
  class game;
}

namespace neo::hud
{
  constexpr int MAX_TEXT_LENGTH = 30;

  void build(neo::game* game);
  void set_text(
    neo::game* game,
    bn::string_view hud_reference,
    bn::string_view text_reference,
    const neo::types::event_value* content);
  void update(neo::game* game);
}

#endif
