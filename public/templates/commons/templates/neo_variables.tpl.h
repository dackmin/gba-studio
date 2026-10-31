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
    bn::fixed fixed_value;

    constexpr value(bn::string_view name_, int val_, bool bool_val_, bn::string_view str_val_, bn::fixed fixed_val_):
      name(name_),
      int_value(val_),
      bool_value(bool_val_),
      str_value(str_val_),
      fixed_value(fixed_val_) {}

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

    constexpr bn::fixed as_fixed () const
    {
      return fixed_value;
    }
  };

  struct variable
  {
    int int_value = 0;
    bn::fixed fixed_value;
    bn::string_view str_value;
    bool bool_value = false;
    bool has_computed_str = false;
    // 6 chars fit -99999..999999, which set_int() clamps to.
    char computed_str[7] = {};

    inline void init (int val_, bool bool_val_, bn::string_view str_val_, bn::fixed fixed_val_)
    {
      int_value = val_;
      bool_value = bool_val_;
      str_value = str_val_;
      fixed_value = fixed_val_;
      has_computed_str = false;
    }

    inline int as_int () const
    {
      return int_value;
    }

    inline bool as_bool () const
    {
      return bool_value;
    }

    inline bn::fixed as_fixed () const
    {
      return fixed_value;
    }

    inline bn::string_view as_string () const
    {
      return has_computed_str ? bn::string_view(computed_str) : str_value;
    }

    inline void set_computed_str (bn::string_view text)
    {
      int size = bn::min(text.size(), 6);

      for (int i = 0; i < size; ++i)
      {
        computed_str[i] = text[i];
      }

      computed_str[size] = 0;
      has_computed_str = true;
    }

    inline void set_int (int val)
    {
      val = bn::clamp(val, -99999, 999999);
      int_value = val;
      bool_value = val != 0;
      fixed_value = bn::fixed(val);
      set_computed_str(bn::string_view(bn::to_string<6>(val)));
    }

    inline void set_fixed (bn::fixed val)
    {
      fixed_value = val;
      set_computed_str(bn::string_view(bn::to_string<6>(fixed_value)));
      bool_value = fixed_value != 0;
    }

    inline void assign (const value& other)
    {
      init(other.int_value, other.bool_value, other.str_value, other.fixed_value);
    }

    inline void assign (const variable& other)
    {
      *this = other;
    }
  };

  struct registry
  {
    static constexpr int COUNT = {{add (valuesCount variables) (scriptParamsCount scripts)}};

    bn::unordered_map<bn::string_view, neo::variables::variable*, {{max (powerOfTwo (add (valuesCount variables) (scriptParamsCount scripts))) 1}}> all;
    neo::variables::variable* items;

    registry(): all(), items(new neo::variables::variable[COUNT > 0 ? COUNT : 1])
    {
      // those damn warnings
      [[maybe_unused]] int next = 0;

      {{#each variables}}
      {{#each this.values}}
      items[next].init(
        {{int this.defaultValue}},
        {{bool this.defaultValue}},
        "{{this.defaultValue}}",
        {{fixed this.defaultValue}}
      );
      all.insert_or_assign("{{this.name}}", &items[next++]);
      {{/each}}
      {{/each}}
      {{#each scripts}}
      {{#each this.parameters}}
      items[next].init(0, false, "", 0);
      all.insert_or_assign("{{scriptParamKey this.id}}", &items[next++]);
      {{/each}}
      {{/each}}
    }

    registry(const registry&) = delete;
    registry& operator=(const registry&) = delete;

    ~registry()
    {
      delete[] items;
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
      set_raw("{{this.name}}", {{int this.defaultValue}}, {{bool this.defaultValue}}, "{{this.defaultValue}}", {{fixed this.defaultValue}});
      {{/each}}
      {{/each}}
      {{#each scripts}}
      {{#each this.parameters}}
      set_raw("{{scriptParamKey this.id}}", 0, false, "", 0);
      {{/each}}
      {{/each}}
    }

    inline void set_raw(bn::string_view key, int int_val, bool bool_val, bn::string_view str_val, bn::fixed fixed_val)
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
        it->second->fixed_value = fixed_val;
        it->second->has_computed_str = false;
      }
    }
  };
}

#endif
