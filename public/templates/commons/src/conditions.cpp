#include <neo_logs.h>

#include <bn_log.h>

#include <neo_types.h>
#include <neo_variables.h>

#include "game.h"
#include "conditions.h"
#include "save.h"

namespace neo::conditions
{
  namespace
  {
    struct condition_operand
    {
      bool numeric = false;
      int number = 0;
      bn::string_view text;
    };

    // Minimal numeric parse for raw values compared against tile coordinates:
    // stops at the first non-digit, so "12ab" → 12 and "down" → 0
    int string_to_int (bn::string_view str)
    {
      int result = 0;
      bool negative = false;
      int i = 0;

      if (!str.empty() && (str[0] == '-' || str[0] == '+'))
      {
        negative = str[0] == '-';
        i = 1;
      }

      for (; i < str.length(); ++i)
      {
        char c = str[i];

        if (c < '0' || c > '9')
        {
          break;
        }

        result = (result * 10) + (c - '0');
      }

      return negative ? -result : result;
    }

    // Player position in tile coordinates (derived from pixel position)
    int get_player_tile_x (neo::game* game)
    {
      return game->active_scene != nullptr
        ? game->active_scene->map_data->to_tile_x(
            game->variables, (int)game->player->position.x())
        : (int)game->player->position.x();
    }

    int get_player_tile_y (neo::game* game)
    {
      return game->active_scene != nullptr
        ? game->active_scene->map_data->to_tile_y(
            game->variables, (int)game->player->position.y())
        : (int)game->player->position.y();
    }

    // Resolves an if-expression to its comparable form. Tile x/y attributes
    // resolve to numbers, variables and raw values expose both their int
    // and text forms, everything else resolves to text.
    condition_operand resolve_operand (neo::game* game, neo::types::if_expression* expression)
    {
      if (expression->type == "variable")
      {
        auto* var_expr = static_cast<neo::types::if_expression_variable*>(expression);

        if (!game->variables.has(var_expr->name))
        {
          BN_LOG("Variable not found: ", var_expr->name);
          return {};
        }

        // Variables are dual-natured: they compare as int against tile
        // coordinates and as text against everything else
        auto& var_value = game->variables.get(var_expr->name);

        BN_LOG("[IF] Getting variable: ", var_expr->name, " = ", var_value.as_string());

        return { false, var_value.as_int(), var_value.as_string() };
      }
      else if (expression->type == "value")
      {
        auto* val_expr = static_cast<neo::types::if_expression_value*>(expression);

        BN_LOG("[IF] Getting raw value: ", val_expr->value);

        return { false, string_to_int(val_expr->value), val_expr->value };
      }
      else if (expression->type == "saved-game")
      {
        BN_LOG("[IF] Getting saved game existence");

        return { false, 0, neo::save::has_save() ? "true" : "false" };
      }
      else if (expression->type == "player-attribute")
      {
        auto* attr_expr = static_cast<neo::types::if_expression_player_attribute*>(expression);

        if (game->player == nullptr)
        {
          BN_LOG("[IF] Player not found");
          return {};
        }

        if (attr_expr->attribute == "x")
        {
          int tile_x = get_player_tile_x(game);

          BN_LOG("[IF] Getting player x: ", tile_x);

          // Tile coordinates have no string form: they force numeric comparison
          return { true, tile_x, "" };
        }
        else if (attr_expr->attribute == "y")
        {
          int tile_y = get_player_tile_y(game);

          BN_LOG("[IF] Getting player y: ", tile_y);

          return { true, tile_y, "" };
        }
        else if (attr_expr->attribute == "direction")
        {
          bn::string_view name = get_direction_string(game->player->direction);

          BN_LOG("[IF] Getting player direction: ", name);

          return { false, 0, name };
        }

        BN_LOG("Unknown player attribute: ", attr_expr->attribute);
        return {};
      }
      else if (expression->type == "direction")
      {
        auto* dir_expr = static_cast<neo::types::if_expression_direction*>(expression);
        bn::string_view name = get_direction_string(dir_expr->value);

        BN_LOG("[IF] Getting direction: ", name);

        return { false, 0, name };
      }

      BN_LOG("Unknown expression type: ", expression->type);
      return {};
    }
  }

  bn::string_view get_direction_string (neo::types::direction direction)
  {
    switch (direction)
    {
      case neo::types::direction::LEFT:
        return "left";
      case neo::types::direction::RIGHT:
        return "right";
      case neo::types::direction::UP:
        return "up";
      case neo::types::direction::UP_LEFT:
        return "up_left";
      case neo::types::direction::UP_RIGHT:
        return "up_right";
      case neo::types::direction::DOWN_LEFT:
        return "down_left";
      case neo::types::direction::DOWN_RIGHT:
        return "down_right";
      default:
        return "down";
    }
  }

  bool evaluate_condition (neo::game* game, neo::types::if_expression* node)
  {
    // A saved-game expression used directly as a condition is truthy if a save exists
    if (node->type == "saved-game")
    {
      BN_LOG("[IF] Checking saved game existence");
      return neo::save::has_save();
    }

    // A bare expression used directly as a condition is truthy if it
    // resolves to a number or a non-empty string
    if (node->type != "condition")
    {
      condition_operand operand = resolve_operand(game, node);
      return operand.numeric || !operand.text.empty();
    }

    auto* condition = static_cast<neo::types::if_condition*>(node);

    if (condition->op == "&&")
    {
      return evaluate_condition(game, condition->left) && evaluate_condition(game, condition->right);
    }
    else if (condition->op == "||")
    {
      return evaluate_condition(game, condition->left) || evaluate_condition(game, condition->right);
    }

    // Comparisons are equality-only for now
    // TODO: allow gt/lt/... comparisons
    condition_operand left = resolve_operand(game, condition->left);
    condition_operand right = resolve_operand(game, condition->right);

    // Tile x/y attributes have no string form, so a comparison touching one
    // is numeric; everything else compares as text
    bool equal;

    if (left.numeric || right.numeric)
    {
      equal = left.number == right.number;
    }
    else
    {
      equal = left.text == right.text;
    }

    return condition->op == "!=" ? !equal : equal;
  }
}
