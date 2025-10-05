#ifndef NEO_BUTTONS_H
#define NEO_BUTTONS_H

#include <bn_core.h>
#include <bn_keypad.h>
#include <bn_vector.h>
#include <bn_string_view.h>

namespace neo::buttons
{
  bool is_pressed(bn::string_view button);
  bool any_pressed(const bn::vector<bn::string_view, 10>& buttons);
  bool all_pressed(const bn::vector<bn::string_view, 10>& buttons);
}

#endif
