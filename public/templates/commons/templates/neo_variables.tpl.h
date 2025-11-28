#ifndef NEO_VARIABLES_H
#define NEO_VARIABLES_H

#define BN_CFG_LOG_ENABLED true

#include <bn_core.h>
#include <bn_log.h>
#include <bn_assert.h>
#include <bn_unordered_map.h>

namespace neo::variables
{
  struct value
  {
    bn::string_view name;
    int int_value;
    bool bool_value;
    bn::string_view str_value;

    value(bn::string_view name_, int val_, bool bool_val_, bn::string_view str_val_):
      name(name_),
      int_value(val_),
      bool_value(bool_val_),
      str_value(str_val_) {}

    inline int as_int () const
    {
      return int_value;
    }

    inline bool as_bool () const
    {
      return bool_value;
    }

    inline bn::string_view as_string () const
    {
      return str_value;
    }
  };

  struct registry
  {
    bn::unordered_map<bn::string_view, neo::variables::value*, {{or (powerOfTwo (valuesCount variables)) 1}}> all;

    registry(): all()
    {
      {{#each variables}}
      {{#each this.values}}
      neo::variables::value* value_{{@../index}}_{{slug this.name}}_{{@index}} = new neo::variables::value(
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
    }

    inline bool has(bn::string_view key)
    {
      if (key.empty()) {
        return false;
      }

      return all.find(key) != all.end();
    }

    inline neo::variables::value& get(bn::string_view key)
    {
      BN_ASSERT(!key.empty(), "Empty variable key requested");

      auto it = all.find(key);
      BN_ASSERT(it != all.end(), "Variable not found: ", key);
      return *(it->second);
    }

    inline void set(bn::string_view key, neo::variables::value* value)
    {
      if (key.empty()) {
        BN_LOG("Empty variable key set attempted");
        return;
      }

      auto it = all.find(key);
      BN_ASSERT(it != all.end(), "Variable not found: ", key);

      BN_LOG("Setting variable:", key, ", to value:", value->as_string());
      it->second = value;
    }
  };
}

#endif
