#ifndef NEO_CONDITIONS_H
#define NEO_CONDITIONS_H

#include <neo_types.h>

namespace neo
{
  class game;
}

namespace neo::conditions
{
  // Evaluates an if-expression tree: conditions (==, !=, &&, ||) compare
  // their operands, single bare operands are truthy if they resolve to a
  // number or a non-empty string (see conditions.cpp).
  bool evaluate_condition(neo::game* game, const neo::types::if_expression* node);

  // Converts a neo::types::direction to its name ("up", "down", ...)
  bn::string_view get_direction_string(neo::types::direction direction);

  bn::string_view get_collision_side_string(neo::types::collision_side side);
}

#endif
