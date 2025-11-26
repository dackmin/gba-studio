#ifndef NEO_SCENES_H
#define NEO_SCENES_H

#include <bn_core.h>
#include <bn_regular_bg_ptr.h>
#include <bn_vector.h>
#include <bn_unique_ptr.h>

#include "neo_types.h"

// Assets
#include <bn_regular_bg_items_bg_default.h>
{{#each scenes}}
#include <bn_regular_bg_items_{{valuedef this.background "bg_default"}}.h>
{{#if this.player.sprite}}
#include <bn_sprite_items_{{valuedef this.player.sprite "sprite_default"}}.h>
{{else}}
#include <bn_sprite_items_sprite_default.h>
{{/if}}
{{#each this.actors}}
#include <bn_sprite_items_{{valuedef this.sprite "sprite_default"}}.h>
{{/each}}
{{#each this.sprites}}
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

  bn::vector<bn::string_view, 5> make_dialog_vector()
  {
    return bn::vector<bn::string_view, 5>();
  }

  template<typename... Args>
  bn::vector<bn::string_view, 5> make_dialog_vector(Args... lines)
  {
    bn::vector<bn::string_view, 5> vec;
    ((vec.push_back(lines)), ...);
    return vec;
  }

  {{#each scenes}}
  //////////////////////////
  // Scene: {{this.name}} //
  //////////////////////////

  // Scene Events
  {{#if (hasItems this.events)}}
  {{>eventsPartial prefix=(concat (slug this.name) "_event") events=this.events}}
  neo::types::event* {{slug this.name}}_events[] = {
    {{#each this.events}}
    &{{slug ../this.name}}_event_{{@index}},
    {{/each}}
  };
  {{/if}}

  // Map collisions
  {{#if this.map}}
  {{#if (hasItems this.map.collisions)}}
  int {{slug this.name}}_map_collisions[{{multiply (valuedef this.map.width 0) (valuedef this.map.height 0)}}] = {
    {{#each this.map.collisions}}
    {{this}}{{#unless @last}},{{/unless}}
    {{/each}}
  };
  {{/if}}

  // Map sensors
  {{#if (hasItems this.map.sensors)}}
  {{#each this.map.sensors}}
  // -- Sensor events
  {{#if (hasItems this.events)}}
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
    {{valuedef this.events.length 0}},
    {{#if (hasItems this.events)}}
    {{slug ../this.name}}_sensor_{{@index}}_events
    {{else}}
    nullptr
    {{/if}}
  };
  {{/each}}

  neo::types::sensor* {{slug this.name}}_map_sensors[] = {
    {{#each this.map.sensors}}
    &{{slug ../this.name}}_sensor_{{@index}}{{#unless @last}},{{/unless}}
    {{/each}}
  };
  {{/if}}

  // Map
  {{>valuePartial prefix=(concat (slug this.name) "_map_grid_size") value=(valuedef this.map.gridSize 16)}}
  neo::types::map {{slug this.name}}_map_data = {
    {{#if this.map}}
    {{valuedef this.map.width 0}},
    {{valuedef this.map.height 0}},
    &{{slug this.name}}_map_grid_size_value,
    {{#if (hasItems this.map.collisions)}}
    {{slug this.name}}_map_collisions,
    {{else}}
    nullptr,
    {{/if}}
    {{else}}
    0, 0, 0, nullptr,
    {{/if}}
    {{#if (hasItems this.map.sensors)}}
    {{this.map.sensors.length}},
    {{slug this.name}}_map_sensors
    {{else}}
    0, nullptr
    {{/if}}
  };
  {{/if}}

  {{#if (hasItems this.actors)}}
  // Actors
  {{#each this.actors}}
  // -- Actor events
  {{#if (hasItems this.events.init)}}
  {{>eventsPartial prefix=(concat (slug ../this.name) "_actor_" @index "_init_event") events=this.events.init}}
  neo::types::event* {{slug ../this.name}}_actor_{{@index}}_init_events[] = {
    {{#each this.events.init}}
    &{{slug ../../this.name}}_actor_{{@../index}}_init_event_{{@index}},
    {{/each}}
  };
  {{/if}}
  {{#if (hasItems this.events.interact)}}
  {{>eventsPartial prefix=(concat (slug ../this.name) "_actor_" @index "_interact_event") events=this.events.interact}}
  neo::types::event* {{slug ../this.name}}_actor_{{@index}}_interact_events[] = {
    {{#each this.events.interact}}
    &{{slug ../../this.name}}_actor_{{@../index}}_interact_event_{{@index}},
    {{/each}}
  };
  {{/if}}
  {{#if (hasItems this.events.update)}}
  {{>eventsPartial prefix=(concat (slug ../this.name) "_actor_" @index "_update_event") events=this.events.update}}
  neo::types::event* {{slug ../this.name}}_actor_{{@index}}_update_events[] = {
    {{#each this.events.update}}
    &{{slug ../../this.name}}_actor_{{@../index}}_update_event_{{@index}},
    {{/each}}
  };
  {{/if}}
  {{>valuePartial prefix=(concat (slug ../this.name) "_actor_" @index "_x") value=(valuedef this.x 0)}}
  {{>valuePartial prefix=(concat (slug ../this.name) "_actor_" @index "_y") value=(valuedef this.y 0)}}
  {{>valuePartial prefix=(concat (slug ../this.name) "_actor_" @index "_z") value=(valuedef this.z 2)}}
  neo::types::actor {{slug ../this.name}}_actor_{{@index}} = {
    "{{this.id}}",
    "{{this.name}}",
    &{{slug ../this.name}}_actor_{{@index}}_x_value,
    &{{slug ../this.name}}_actor_{{@index}}_y_value,
    &{{slug ../this.name}}_actor_{{@index}}_z_value,
    neo::types::direction::{{uppercase (valuedef this.direction "down")}},
    bn::sprite_items::{{valuedef this.sprite "sprite_default"}},
    {{#if (hasItems this.events.init)}}
    {{this.events.init.length}},
    {{slug ../this.name}}_actor_{{@index}}_init_events,
    {{else}}
    0,
    nullptr,
    {{/if}}
    {{#if (hasItems this.events.interact)}}
    {{this.events.interact.length}},
    {{slug ../this.name}}_actor_{{@index}}_interact_events,
    {{else}}
    0,
    nullptr,
    {{/if}}
    {{#if (hasItems this.events.update)}}
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

  {{#if (hasItems this.sprites)}}
  // Sprites
  {{#each this.sprites}}
  {{>valuePartial prefix=(concat (slug ../this.name) "_sprite_" @index "_x") value=(valuedef this.x 0)}}
  {{>valuePartial prefix=(concat (slug ../this.name) "_sprite_" @index "_y") value=(valuedef this.y 0)}}
  {{>valuePartial prefix=(concat (slug ../this.name) "_sprite_" @index "_z") value=(valuedef this.z 2)}}
  neo::types::sprite {{slug ../this.name}}_sprite_{{@index}} = {
    "{{this.id}}",
    "{{this.name}}",
    &{{slug ../this.name}}_sprite_{{@index}}_x_value,
    &{{slug ../this.name}}_sprite_{{@index}}_y_value,
    &{{slug ../this.name}}_sprite_{{@index}}_z_value,
    bn::sprite_items::{{valuedef this.sprite "sprite_default"}}
  };
  {{/each}}
  neo::types::sprite* {{slug this.name}}_sprites[] = {
    {{#each this.sprites}}
    &{{slug ../this.name}}_sprite_{{@index}}{{#unless @last}},{{/unless}}
    {{/each}}
  };
  {{/if}}

  // Scene
  {{>valuePartial prefix=(concat (slug this.name) "_player_x") value=(valuedef this.player.x 0)}}
  {{>valuePartial prefix=(concat (slug this.name) "_player_y") value=(valuedef this.player.y 0)}}
  {{>valuePartial prefix=(concat (slug this.name) "_player_z") value=(valuedef this.player.z 1)}}
  neo::types::scene scene_{{slug this.name}} = {
    "{{this.id}}",
    "{{this.name}}",
    {{#if this.background}}
    bn::regular_bg_items::{{this.background}},
    {{else}}
    bn::regular_bg_items::bg_default,
    {{/if}}
    {{#if (hasItems this.events)}}
    {{this.events.length}},
    {{slug this.name}}_events,
    {{else}}
    0,
    nullptr,
    {{/if}}
    {{#if this.player}}
    true,
    &{{slug this.name}}_player_x_value,
    &{{slug this.name}}_player_y_value,
    &{{slug this.name}}_player_z_value,
    neo::types::direction::{{uppercase (valuedef this.player.direction 'down')}},
    bn::sprite_items::{{valuedef this.player.sprite "sprite_default"}},
    {{else}}
    false,
    &{{slug this.name}}_player_x_value,
    &{{slug this.name}}_player_y_value,
    &{{slug this.name}}_player_z_value,
    neo::types::direction::DOWN,
    bn::sprite_items::sprite_default,
    {{/if}}
    {{#if this.map}}
    &{{slug this.name}}_map_data,
    {{else}}
    nullptr,
    {{/if}}
    {{#if (hasItems this.actors)}}
    {{this.actors.length}},
    {{slug this.name}}_actors,
    {{else}}
    0,
    nullptr,
    {{/if}}
    {{#if (hasItems this.sprites)}}
    {{this.sprites.length}},
    {{slug this.name}}_sprites
    {{else}}
    0,
    nullptr
    {{/if}}
  };
  //////////////////////////
  {{/each}}

  // Default scene
  {{>valuePartial prefix="default_player_x" value="0"}}
  {{>valuePartial prefix="default_player_y" value="0"}}
  {{>valuePartial prefix="default_player_z" value="1"}}
  neo::types::scene scene_default = {
    "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "default",
    bn::regular_bg_items::bg_default,
    0,
    nullptr,
    false,
    &default_player_x_value,
    &default_player_y_value,
    &default_player_z_value,
    neo::types::direction::DOWN,
    bn::sprite_items::sprite_default,
    nullptr,
    0,
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
  {{#if (hasItems this.events)}}
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
    {{#if (hasItems this.events)}}
    {{this.events.length}},
    {{slug this.name}}_script_events
    {{else}}
    0,
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
