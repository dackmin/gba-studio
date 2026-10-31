#ifndef NEO_BUTTONS_H
#define NEO_BUTTONS_H

#include <bn_core.h>
#include <bn_keypad.h>
#include <bn_span.h>
#include <bn_string_view.h>

namespace neo::buttons
{
  bool is_pressed(bn::string_view button);
  bool any_pressed(bn::span<const bn::string_view> buttons);
  bool all_pressed(bn::span<const bn::string_view> buttons);
}

#endif
