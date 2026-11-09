#ifndef NEO_PLUGIN_H
#define NEO_PLUGIN_H

#include <bn_core.h>
#include <bn_log.h>
#include <bn_string_view.h>

#include <neo_types.h>

#include "game.h"

{{#each plugins}}
{{#each this.events}}
// Plugin event: {{../id}}:{{this.id}}
{{#if this._namespace}}
namespace {{this._namespace}}
{
  void {{this._function}}(neo::game* game, const neo::types::plugin_event* e);
}
{{else}}
void {{this._function}}(neo::game* game, const neo::types::plugin_event* e);
{{/if}}

{{/each}}
{{/each}}
namespace neo::plugins
{
  inline void dispatch(neo::game* game, const neo::types::plugin_event* e)
  {
    (void) game;

    switch (e->handler_id)
    {
{{#each plugins}}
{{#each this.events}}
      case {{this._handlerId}}: // {{../id}}:{{this.id}}
        {{#if this._namespace}}{{this._namespace}}::{{/if}}{{this._function}}(game, e);
        break;
{{/each}}
{{/each}}
      default:
        BN_LOG("Unknown plugin event handler: ", e->handler_id);
        break;
    }
  }
}

#endif
