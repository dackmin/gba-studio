#ifndef NEO_VARIABLES_H
#define NEO_VARIABLES_H

#include <neo_logs.h>

#include <bn_core.h>
#include <bn_log.h>
#include <bn_assert.h>
#include <bn_algorithm.h>
#include <bn_string.h>
#include <bn_unordered_map.h>

namespace neo::variables
{
  struct value
  {
    bn::string_view name;
    int int_value;
    bool bool_value;
    bn::string_view str_value;

    constexpr value(bn::string_view name_, int val_, bool bool_val_, bn::string_view str_val_):
      name(name_),
      int_value(val_),
      bool_value(bool_val_),
      str_value(str_val_) {}

    constexpr int as_int () const
    {
      return int_value;
    }

    constexpr bool as_bool () const
    {
      return bool_value;
    }

    constexpr bn::string_view as_string () const
    {
      return str_value;
    }
  };

  // Registry-owned runtime variable: only these need a text buffer for computed ints
  struct variable: value
  {
    // 6 chars fit -99999..999999, which set_int() clamps to.
    bn::string<6> computed_str;
    bool has_computed_str = false;

    variable(bn::string_view name_, int val_, bool bool_val_, bn::string_view str_val_):
      value(name_, val_, bool_val_, str_val_) {}

    inline bn::string_view as_string () const
    {
      return has_computed_str ? bn::string_view(computed_str) : str_value;
    }

    inline void set_int (int val)
    {
      val = bn::clamp(val, -99999, 999999);
      int_value = val;
      bool_value = val != 0;
      computed_str = bn::to_string<6>(val);
      has_computed_str = true;
    }

    inline void assign (const value& other)
    {
      int_value = other.int_value;
      bool_value = other.bool_value;
      str_value = other.str_value;
      has_computed_str = false;
    }

    inline void assign (const variable& other)
    {
      int_value = other.int_value;
      bool_value = other.bool_value;
      str_value = other.str_value;
      computed_str = other.computed_str;
      has_computed_str = other.has_computed_str;
    }
  };

  struct registry
  {
    bn::unordered_map<bn::string_view, neo::variables::variable*, {{max (powerOfTwo (add (valuesCount variables) (scriptParamsCount scripts))) 1}}> all;

    registry(): all()
    {
      {{#each variables}}
      {{#each this.values}}
      neo::variables::variable* value_{{@../index}}_{{slug this.name}}_{{@index}} = new neo::variables::variable(
        "{{this.name}}",
        {{int this.defaultValue}},
        {{bool this.defaultValue}},
        "{{this.defaultValue}}"
      );
      all.insert_or_assign(
        "{{this.name}}",
        value_{{@../index}}_{{slug this.name}}_{{@index}}
      );
      {{/each}}
      {{/each}}
      {{#each scripts}}
      {{#each this.parameters}}
      neo::variables::variable* script_parameter_{{@../index}}_{{@index}} = new neo::variables::variable(
        "{{scriptParamKey this.id}}", 0, false, ""
      );
      all.insert_or_assign("{{scriptParamKey this.id}}", script_parameter_{{@../index}}_{{@index}});
      {{/each}}
      {{/each}}
    }

    inline bool has(bn::string_view key)
    {
      if (key.empty()) {
        return false;
      }

      return all.find(key) != all.end();
    }

    inline neo::variables::variable& get(bn::string_view key)
    {
      BN_ASSERT(!key.empty(), "Empty variable key requested");

      auto it = all.find(key);
      BN_ASSERT(it != all.end(), "Variable not found: ", key);
      return *(it->second);
    }

    inline void set(bn::string_view key, const neo::variables::value* value)
    {
      if (key.empty()) {
        BN_LOG("Empty variable key set attempted");
        return;
      }

      auto it = all.find(key);
      BN_ASSERT(it != all.end(), "Variable not found: ", key);

      BN_LOG("Setting variable:", key, ", to value:", value->as_string());
      // Copy into the variable's own storage so later increments don't alter the event's value
      it->second->assign(*value);
    }

    inline void reset()
    {
      {{#each variables}}
      {{#each this.values}}
      set_raw("{{this.name}}", {{int this.defaultValue}}, {{bool this.defaultValue}}, "{{this.defaultValue}}");
      {{/each}}
      {{/each}}
      {{#each scripts}}
      {{#each this.parameters}}
      set_raw("{{scriptParamKey this.id}}", 0, false, "");
      {{/each}}
      {{/each}}
    }

    inline void set_raw(bn::string_view key, int int_val, bool bool_val, bn::string_view str_val)
    {
      if (key.empty()) {
        BN_LOG("Empty variable key set_raw attempted");
        return;
      }

      auto it = all.find(key);
      if (it != all.end() && it->second != nullptr) {
        BN_LOG("Setting variable raw:", key, ", to value:", str_val);
        it->second->int_value = int_val;
        it->second->bool_value = bool_val;
        it->second->str_value = str_val;
        it->second->has_computed_str = false;
      }
    }
  };
}

#endif
