#ifndef NEO_SCENES_H
#define NEO_SCENES_H

#include <bn_core.h>
#include <bn_regular_bg_ptr.h>
#include <bn_vector.h>

#include "neo_types.h"

// Assets
#include <bn_regular_bg_items_bg_default.h>
{{#each scenes}}
#include <bn_regular_bg_items_{{valuedef this.background "bg_default"}}.h>
{{#each this.actors}}
#include <bn_sprite_items_{{valuedef this.sprite "sprite_default"}}.h>
{{/each}}
{{/each}}

namespace neo::scenes
{
  bn::string_view get_starting_scene ()
  {
    return "{{valuedef project.startingScene scenes.[0].id}}";
  }

  bn::vector<bn::string_view, 10> make_button_vector()
  {
    return bn::vector<bn::string_view, 10>();
  }

  template<typename... Args>
  bn::vector<bn::string_view, 10> make_button_vector(Args... buttons)
  {
    bn::vector<bn::string_view, 10> vec;
    ((vec.push_back(buttons)), ...);
    return vec;
  }

  {{#each scenes}}
  //////////////////////////
  // Scene: {{this.name}} //
  //////////////////////////

  // Scene Events
  {{#if this.events}}
  {{>eventsPartial prefix=(concat (slug this.name) "_event") events=this.events}}
  {{/if}}
  neo::types::event* {{slug this.name}}_events[] = {
    {{#each this.events}}
    &{{slug ../this.name}}_event_{{@index}},
    {{/each}}
  };

  // Map collisions
  {{#if this.map}}
  int {{slug this.name}}_map_collisions[{{multiply this.map.width this.map.height}}] = {
    {{#each this.map.collisions}}
    {{this}}{{#unless @last}},{{/unless}}
    {{/each}}
  };

  // Map sensors
  {{#if this.map.sensors}}
  {{#each this.map.sensors}}

  // -- Sensor events
  {{#if this.events}}
  {{>eventsPartial prefix=(concat (slug ../this.name) "_sensor_" @index "_event") events=this.events}}
  {{/if}}
  neo::types::event* {{slug ../this.name}}_sensor_{{@index}}_events[] = {
    {{#each this.events}}
    &{{slug ../../this.name}}_sensor_{{@../index}}_event_{{@index}},
    {{/each}}
  };

  // -- Sensor
  neo::types::sensor {{slug ../this.name}}_sensor_{{@index}} = {
    "{{this.id}}",
    {{this.x}},
    {{this.y}},
    {{valuedef this.width 1}},
    {{valuedef this.height 1}},
    {{this.events.length}},
    {{slug ../this.name}}_sensor_{{@index}}_events
  };
  {{/each}}

  neo::types::sensor* {{slug this.name}}_map_sensors[] = {
    {{#each this.map.sensors}}
    &{{slug ../this.name}}_sensor_{{@index}}{{#unless @last}},{{/unless}}
    {{/each}}
  };
  {{/if}}

  // Map
  neo::types::map {{slug this.name}}_map_data = {
    {{#if this.map}}
    {{this.map.width}},
    {{this.map.height}},
    {{valuedef this.map.gridSize 16}},
    {{#if this.map.collisions}}
    {{slug this.name}}_map_collisions,
    {{else}}
    nullptr,
    {{/if}}
    {{else}}
    0, 0, 0, nullptr,
    {{/if}}
    {{#if this.map.sensors}}
    {{this.map.sensors.length}},
    {{slug this.name}}_map_sensors
    {{else}}
    0, nullptr
    {{/if}}
  };
  {{/if}}

  {{#if this.actors.length}}
  // Actors
  {{#each this.actors}}
  // -- Actor events
  {{#if this.events.init.length}}
  {{>eventsPartial prefix=(concat (slug ../this.name) "_actor_" @index "_init_event") events=this.events.init}}
  neo::types::event* {{slug ../this.name}}_actor_{{@index}}_init_events[] = {
    {{#each this.events.init}}
    &{{slug ../../this.name}}_actor_{{@../index}}_init_event_{{@index}},
    {{/each}}
  };
  {{/if}}
  {{#if this.events.interact.length}}
  {{>eventsPartial prefix=(concat (slug ../this.name) "_actor_" @index "_interact_event") events=this.events.interact}}
  neo::types::event* {{slug ../this.name}}_actor_{{@index}}_interact_events[] = {
    {{#each this.events.interact}}
    &{{slug ../../this.name}}_actor_{{@../index}}_interact_event_{{@index}},
    {{/each}}
  };
  {{/if}}
  {{#if this.events.update.length}}
  {{>eventsPartial prefix=(concat (slug ../this.name) "_actor_" @index "_update_event") events=this.events.update}}
  neo::types::event* {{slug ../this.name}}_actor_{{@index}}_update_events[] = {
    {{#each this.events.update}}
    &{{slug ../../this.name}}_actor_{{@../index}}_update_event_{{@index}},
    {{/each}}
  };
  {{/if}}
  neo::types::actor {{slug ../this.name}}_actor_{{@index}} = {
    "{{this.id}}",
    "{{this.name}}",
    {{valuedef this.x 0}},
    {{valuedef this.y 0}},
    neo::types::direction::{{uppercase (valuedef this.direction "down")}},
    bn::sprite_items::{{valuedef this.sprite "sprite_default"}},
    {{#if this.events.init.length}}
    {{this.events.init.length}},
    {{slug ../this.name}}_actor_{{@index}}_init_events,
    {{else}}
    0,
    nullptr,
    {{/if}}
    {{#if this.events.interact.length}}
    {{this.events.interact.length}},
    {{slug ../this.name}}_actor_{{@index}}_interact_events,
    {{else}}
    0,
    nullptr,
    {{/if}}
    {{#if this.events.update.length}}
    {{this.events.update.length}},
    {{slug ../this.name}}_actor_{{@index}}_update_events
    {{else}}
    0,
    nullptr
    {{/if}}
  };
  {{/each}}
  neo::types::actor* {{slug this.name}}_actors[] = {
    {{#each this.actors}}
    &{{slug ../this.name}}_actor_{{@index}}{{#unless @last}},{{/unless}}
    {{/each}}
  };
  {{/if}}

  // Scene
  neo::types::scene scene_{{slug this.name}} = {
    "{{this.id}}",
    "{{this.name}}",
    {{#if this.background}}
    bn::regular_bg_items::{{this.background}},
    {{else}}
    bn::regular_bg_items::bg_default,
    {{/if}}
    {{this.events.length}},
    {{slug this.name}}_events,
    {{#if this.player}}
    true,
    { {{this.player.x}}, {{this.player.y}} },
    neo::types::direction::{{uppercase (valuedef this.player.direction 'down')}},
    {{else}}
    false,
    { 0, 0 },
    neo::types::direction::DOWN,
    {{/if}}
    {{#if this.map}}
    &{{slug this.name}}_map_data,
    {{else}}
    nullptr,
    {{/if}}
    {{#if this.actors}}
    {{this.actors.length}},
    {{slug this.name}}_actors
    {{else}}
    0,
    nullptr
    {{/if}}
  };
  //////////////////////////
  {{/each}}

  // Default scene
  neo::types::scene scene_default = {
    "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "default",
    bn::regular_bg_items::bg_default,
    0,
    nullptr,
    false,
    { 0, 0 },
    neo::types::direction::DOWN,
    nullptr,
    0,
    nullptr
  };

  neo::types::scene get_scene(bn::string_view name)
  {
    if (name == "") return scene_default;
    {{#each scenes}}
    if (name == "{{this.name}}" || name == "{{this.id}}") return scene_{{slug this.name}};
    {{/each}}
    return scene_default;
  }

  // Scripts
  {{#each scripts}}
  {{#if this.events}}
  {{>eventsPartial prefix=(concat (slug this.name) "_script_event") events=this.events}}
  neo::types::event* {{slug this.name}}_script_events[] = {
    {{#each this.events}}
    &{{slug ../this.name}}_script_event_{{@index}},
    {{/each}}
  };
  {{/if}}
  neo::types::script script_{{slug this.name}} = {
    "{{this.id}}",
    "{{this.name}}",
    {{this.events.length}},
    {{#if this.events}}
    {{slug this.name}}_script_events
    {{else}}
    nullptr
    {{/if}}
  };
  {{/each}}

  // Default script
  neo::types::script script_default = {
    "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "default",
    0,
    nullptr
  };

  neo::types::script get_script(bn::string_view name)
  {
    if (name == "") return script_default;
    {{#each scripts}}
    if (name == "{{this.name}}" || name == "{{this.id}}") return script_{{slug this.name}};
    {{/each}}

    return script_default;
  }
}

#endif
