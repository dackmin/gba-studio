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
#include <bn_regular_bg_items_{{getBackgroundName @root/backgrounds (valuedef this.background "bg_default")}}.h>
{{#if this.player.sprite}}
#include <bn_sprite_items_{{getSpriteName @root/sprites (valuedef this.player.sprite "sprite_default")}}.h>
{{else}}
#include <bn_sprite_items_sprite_default.h>
{{/if}}
{{#each this.actors}}
#include <bn_sprite_items_{{getSpriteName @root/sprites (valuedef this.sprite "sprite_default")}}.h>
{{/each}}
{{#each this.sprites}}
#include <bn_sprite_items_{{getSpriteName @root/sprites (valuedef this.sprite "sprite_default")}}.h>
{{/each}}
{{/each}}

namespace neo::scenes
{
  BN_DATA_EWRAM bn::string_view STARTING_SCENE = "{{valuedef project.startingScene scenes.[0].id}}";

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

  bn::vector<neo::types::menu_choice, 5> make_menu_vector()
  {
    return bn::vector<neo::types::menu_choice, 5>();
  }

  template<typename... Args>
  bn::vector<neo::types::menu_choice, 5> make_menu_vector(Args... choices)
  {
    bn::vector<neo::types::menu_choice, 5> vec;
    ((vec.push_back(choices)), ...);
    return vec;
  }

  {{#each sprites}}
  //////////////////////////
  // Sprite: {{this.name}} //
  //////////////////////////
  {{#if (hasItems this._animations)}}
  {{>animationsPartial prefix=(concat (slug this.name) "_animation") animations=this._animations}}
  BN_DATA_EWRAM int {{slug this.name}}_animations_count = {{this._animations.length}};
  BN_DATA_EWRAM neo::types::sprite_animation* {{slug this.name}}_animations[] = {
    {{#each this._animations}}
    &{{slug ../this.name}}_animation_{{@index}}{{#unless @last}},{{/unless}}
    {{/each}}
  };
  {{/if}}
  {{/each}}

  {{#each scenes}}
  //////////////////////////
  // Scene: {{this.name}} //
  //////////////////////////

  // Scene Events
  {{#if (hasItems this.events)}}
  {{>eventsPartial prefix=(concat (slug this.name) "_event") events=this.events}}
  BN_DATA_EWRAM neo::types::event* {{slug this.name}}_events[] = {
    {{#each this.events}}
    &{{slug ../this.name}}_event_{{@index}},
    {{/each}}
  };
  {{/if}}

  // Map collisions
  {{#if this.map}}
  {{#if (hasItems this.map.collisions)}}
  BN_DATA_EWRAM int {{slug this.name}}_map_collisions[{{multiply (valuedef this.map.width 0) (valuedef this.map.height 0)}}] = {
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
  BN_DATA_EWRAM neo::types::event* {{slug ../this.name}}_sensor_{{@index}}_events[] = {
    {{#each this.events}}
    &{{slug ../../this.name}}_sensor_{{@../index}}_event_{{@index}},
    {{/each}}
  };

  // -- Sensor
  BN_DATA_EWRAM bn::string_view {{slug ../this.name}}_sensor_{{@index}}_id = "{{this.id}}";
  BN_DATA_EWRAM neo::types::sensor {{slug ../this.name}}_sensor_{{@index}} = {
    {{slug ../this.name}}_sensor_{{@index}}_id,
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
  BN_DATA_EWRAM neo::types::map {{slug this.name}}_map_data = {
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
  BN_DATA_EWRAM neo::types::event* {{slug ../this.name}}_actor_{{@index}}_init_events[] = {
    {{#each this.events.init}}
    &{{slug ../../this.name}}_actor_{{@../index}}_init_event_{{@index}},
    {{/each}}
  };
  {{/if}}
  {{#if (hasItems this.events.interact)}}
  {{>eventsPartial prefix=(concat (slug ../this.name) "_actor_" @index "_interact_event") events=this.events.interact}}
  BN_DATA_EWRAM neo::types::event* {{slug ../this.name}}_actor_{{@index}}_interact_events[] = {
    {{#each this.events.interact}}
    &{{slug ../../this.name}}_actor_{{@../index}}_interact_event_{{@index}},
    {{/each}}
  };
  {{/if}}
  {{#if (hasItems this.events.update)}}
  {{>eventsPartial prefix=(concat (slug ../this.name) "_actor_" @index "_update_event") events=this.events.update}}
  BN_DATA_EWRAM neo::types::event* {{slug ../this.name}}_actor_{{@index}}_update_events[] = {
    {{#each this.events.update}}
    &{{slug ../../this.name}}_actor_{{@../index}}_update_event_{{@index}},
    {{/each}}
  };
  {{/if}}

  {{>valuePartial prefix=(concat (slug ../this.name) "_actor_" @index "_x") value=(valuedef this.x 0)}}
  {{>valuePartial prefix=(concat (slug ../this.name) "_actor_" @index "_y") value=(valuedef this.y 0)}}
  {{>valuePartial prefix=(concat (slug ../this.name) "_actor_" @index "_z") value=(valuedef this.z 2)}}
  BN_DATA_EWRAM bn::string_view {{slug ../this.name}}_actor_{{@index}}_id = "{{this.id}}";
  BN_DATA_EWRAM bn::string_view {{slug ../this.name}}_actor_{{@index}}_name = "{{this.name}}";
  BN_DATA_EWRAM neo::types::actor {{slug ../this.name}}_actor_{{@index}} = {
    {{slug ../this.name}}_actor_{{@index}}_id,
    {{slug ../this.name}}_actor_{{@index}}_name,
    &{{slug ../this.name}}_actor_{{@index}}_x_value,
    &{{slug ../this.name}}_actor_{{@index}}_y_value,
    &{{slug ../this.name}}_actor_{{@index}}_z_value,
    neo::types::direction::{{uppercase (valuedef this.direction "down")}},
    bn::sprite_items::{{getSpriteName @root/sprites (valuedef this.sprite "sprite_default")}},
    // Events
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
    {{slug ../this.name}}_actor_{{@index}}_update_events,
    {{else}}
    0,
    nullptr,
    {{/if}}
    // Animations
    {{#if this._spriteHasAnimations}}
    {{getSpriteName @root/sprites (valuedef this.sprite "sprite_default")}}_animations_count,
    {{getSpriteName @root/sprites (valuedef this.sprite "sprite_default")}}_animations,
    {{else}}
    0,
    nullptr
    {{/if}}
  };
  {{/each}}
  BN_DATA_EWRAM neo::types::actor* {{slug this.name}}_actors[] = {
    {{#each this.actors}}
    &{{slug ../this.name}}_actor_{{@index}}{{#unless @last}},{{/unless}}
    {{/each}}
  };
  {{/if}}

  {{#if (hasItems this.sprites)}}
  // Sprites
  {{#each this.sprites}}
  // -- Sprite events
  {{#if (hasItems this.events.init)}}
  {{>eventsPartial prefix=(concat (slug ../this.name) "_sprite_" @index "_init_event") events=this.events.init}}
  BN_DATA_EWRAM neo::types::event* {{slug ../this.name}}_sprite_{{@index}}_init_events[] = {
    {{#each this.events.init}}
    &{{slug ../../this.name}}_sprite_{{@../index}}_init_event_{{@index}},
    {{/each}}
  };
  {{/if}}
  {{>valuePartial prefix=(concat (slug ../this.name) "_sprite_" @index "_x") value=(valuedef this.x 0)}}
  {{>valuePartial prefix=(concat (slug ../this.name) "_sprite_" @index "_y") value=(valuedef this.y 0)}}
  {{>valuePartial prefix=(concat (slug ../this.name) "_sprite_" @index "_z") value=(valuedef this.z 2)}}
  BN_DATA_EWRAM bn::string_view {{slug ../this.name}}_sprite_{{@index}}_id = "{{this.id}}";
  BN_DATA_EWRAM bn::string_view {{slug ../this.name}}_sprite_{{@index}}_name = "{{this.name}}";
  BN_DATA_EWRAM neo::types::sprite {{slug ../this.name}}_sprite_{{@index}} = {
    {{slug ../this.name}}_sprite_{{@index}}_id,
    {{slug ../this.name}}_sprite_{{@index}}_name,
    &{{slug ../this.name}}_sprite_{{@index}}_x_value,
    &{{slug ../this.name}}_sprite_{{@index}}_y_value,
    &{{slug ../this.name}}_sprite_{{@index}}_z_value,
    bn::sprite_items::{{getSpriteName @root/sprites (valuedef this.sprite "sprite_default")}},
    // Events
    {{#if (hasItems this.events.init)}}
    {{this.events.init.length}},
    {{slug ../this.name}}_sprite_{{@index}}_init_events
    {{else}}
    0,
    nullptr
    {{/if}}
  };
  {{/each}}
  BN_DATA_EWRAM neo::types::sprite* {{slug this.name}}_sprites[] = {
    {{#each this.sprites}}
    &{{slug ../this.name}}_sprite_{{@index}}{{#unless @last}},{{/unless}}
    {{/each}}
  };
  {{/if}}

  // Scene
  {{#if this.player}}
  {{>valuePartial prefix=(concat (slug this.name) "_player_x") value=(valuedef this.player.x 0)}}
  {{>valuePartial prefix=(concat (slug this.name) "_player_y") value=(valuedef this.player.y 0)}}
  {{>valuePartial prefix=(concat (slug this.name) "_player_z") value=(valuedef this.player.z 1)}}

  // Player
  BN_DATA_EWRAM bn::string_view {{slug this.name}}_player_id = "player";
  BN_DATA_EWRAM bn::string_view {{slug this.name}}_player_name = "player";
  BN_DATA_EWRAM neo::types::actor {{slug this.name}}_player_actor = {
    {{slug this.name}}_player_id,
    {{slug this.name}}_player_name,
    &{{slug this.name}}_player_x_value,
    &{{slug this.name}}_player_y_value,
    &{{slug this.name}}_player_z_value,
    neo::types::direction::{{uppercase (valuedef this.player.direction 'down')}},
    bn::sprite_items::{{getSpriteName @root/sprites (valuedef this.player.sprite "sprite_default")}},
    0,
    nullptr,
    0,
    nullptr,
    0,
    nullptr,
    {{#if this.player._spriteHasAnimations}}
    {{getSpriteName @root/sprites (valuedef this.player.sprite "sprite_default")}}_animations_count,
    {{getSpriteName @root/sprites (valuedef this.player.sprite "sprite_default")}}_animations
    {{else}}
    0,
    nullptr
    {{/if}}
  };
  {{/if}}

  BN_DATA_EWRAM bn::string_view {{slug this.name}}_scene_id = "{{this.id}}";
  BN_DATA_EWRAM bn::string_view {{slug this.name}}_scene_name = "{{this.name}}";
  BN_DATA_EWRAM neo::types::scene scene_{{slug this.name}} = {
    {{slug this.name}}_scene_id,
    {{slug this.name}}_scene_name,
    {{#if this.background}}
    bn::regular_bg_items::{{getBackgroundName @root/backgrounds (valuedef this.background "bg_default")}},
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
    &{{slug this.name}}_player_actor,
    {{else}}
    false,
    nullptr,
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
  BN_DATA_EWRAM bn::string_view default_scene_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
  BN_DATA_EWRAM bn::string_view default_scene_name = "default";
  BN_DATA_EWRAM neo::types::scene scene_default = {
    default_scene_id,
    default_scene_name,
    bn::regular_bg_items::bg_default,
    0,
    nullptr,
    false,
    nullptr,
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
  BN_DATA_EWRAM neo::types::event* {{slug this.name}}_script_events[] = {
    {{#each this.events}}
    &{{slug ../this.name}}_script_event_{{@index}},
    {{/each}}
  };
  {{/if}}
  BN_DATA_EWRAM bn::string_view {{slug this.name}}_script_id = "{{this.id}}";
  BN_DATA_EWRAM bn::string_view {{slug this.name}}_script_name = "{{this.name}}";
  BN_DATA_EWRAM neo::types::script script_{{slug this.name}} = {
    {{slug this.name}}_script_id,
    {{slug this.name}}_script_name,
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
  BN_DATA_EWRAM bn::string_view script_default_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
  BN_DATA_EWRAM bn::string_view script_default_name = "default";
  BN_DATA_EWRAM neo::types::script script_default = {
    script_default_id,
    script_default_name,
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
