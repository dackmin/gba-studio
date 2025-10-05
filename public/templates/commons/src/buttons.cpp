#include <bn_core.h>
#include <bn_keypad.h>
#include <bn_vector.h>
#include <bn_string_view.h>

namespace neo::buttons
{
  bool is_pressed(bn::string_view button)
  {
    if (button == "Start") return bn::keypad::start_pressed();
    if (button == "Select") return bn::keypad::select_pressed();
    if (button == "A") return bn::keypad::a_pressed();
    if (button == "B") return bn::keypad::b_pressed();
    if (button == "Up") return bn::keypad::up_pressed();
    if (button == "Down") return bn::keypad::down_pressed();
    if (button == "Left") return bn::keypad::left_pressed();
    if (button == "Right") return bn::keypad::right_pressed();
    if (button == "L") return bn::keypad::l_pressed();
    if (button == "R") return bn::keypad::r_pressed();
    return false;
  }

  bool any_pressed(const bn::vector<bn::string_view, 10>& buttons)
  {
    for (const bn::string_view& button : buttons)
    {
      if (is_pressed(button)) return true;
    }
    return false;
  }

  bool all_pressed(const bn::vector<bn::string_view, 10>& buttons)
  {
    for (const bn::string_view& button : buttons)
    {
      if (!is_pressed(button)) return false;
    }
    return true;
  }
}
