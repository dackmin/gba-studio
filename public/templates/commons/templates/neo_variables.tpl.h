#ifndef NEO_VARIABLES_H
#define NEO_VARIABLES_H

#define BN_CFG_LOG_ENABLED true

#include <bn_core.h>
#include <bn_assert.h>
#include <bn_unordered_map.h>

namespace neo::variables
{
  struct registry
  {
    bn::unordered_map<bn::string_view, bn::string_view, {{or variables.length 1}}> all;

    inline void init ()
    {
      {{#each variables}}
      {{#each (entries this.values) }}
      all.insert("{{this.[0]}}", "{{this.[1]}}");
      {{/each}}
      {{/each}}
    }

    inline void set(bn::string_view key, bn::string_view value)
    {
      auto it = all.find(key);
      BN_ASSERT(it != all.end(), "Variable not found: ", key);
      it->second = value;
    }
  };
}

#endif
