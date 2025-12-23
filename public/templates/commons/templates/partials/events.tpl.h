{{#each events}}
{{#if (neq this.enabled false)}}
{{#if (eq this.type "wait")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=this.duration}}
bn::string_view {{../prefix}}_{{@index}}_type = "wait";
neo::types::wait_event {{../prefix}}_{{@index}}({{../prefix}}_{{@index}}_type, &{{../prefix}}_{{@index}}_duration_value);
{{else if (eq this.type "fade-in")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=this.duration}}
bn::string_view {{../prefix}}_{{@index}}_type = "fade-in";
neo::types::fade_event {{../prefix}}_{{@index}}({{../prefix}}_{{@index}}_type, &{{../prefix}}_{{@index}}_duration_value);
{{else if (eq this.type "fade-out")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=this.duration}}
bn::string_view {{../prefix}}_{{@index}}_type = "fade-out";
neo::types::fade_event {{../prefix}}_{{@index}}({{../prefix}}_{{@index}}_type, &{{../prefix}}_{{@index}}_duration_value);
{{else if (or (eq this.type "wait-for-button") (eq this.type "on-button-press"))}}
{{#if (eq this.type "on-button-press")}}
{{#if this.events}}
{{>eventsPartial prefix=(concat ../prefix "_" @index "_event") events=this.events}}
{{/if}}
neo::types::event* {{../prefix}}_{{@index}}_events[] = {
  {{#each this.events}}
  &{{../../prefix}}_{{@../index}}_event_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
bn::string_view {{../prefix}}_{{@index}}_type = "{{this.type}}";
neo::types::button_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{valuedef this.every false}},
  make_button_vector(
    {{#each this.buttons}}
    "{{this}}"{{#unless @last}},{{/unless}}
    {{/each}}
  ),
  {{#if (eq this.type "on-button-press")}}
  {{this.events.length}},
  {{../prefix}}_{{@index}}_events
  {{else}}
  0,
  nullptr
  {{/if}}
);
{{else if (eq this.type "go-to-scene")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_start_x") value=(valuedef this.start.x -1)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_start_y") value=(valuedef this.start.y -1)}}
bn::string_view {{../prefix}}_{{@index}}_type = "go-to-scene";
bn::string_view {{../prefix}}_{{@index}}_target = "{{this.target}}";
neo::types::scene_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_target,
  &{{../prefix}}_{{@index}}_start_x_value,
  &{{../prefix}}_{{@index}}_start_y_value,
  neo::types::direction::{{uppercase (valuedef this.start.direction 'down')}}
);
{{else if (eq this.type "show-dialog")}}
bn::string_view {{../prefix}}_{{@index}}_type = "show-dialog";
{{#each (truncate this.text 27)}}
bn::string_view {{../../prefix}}_{{@../index}}_line_{{@index}} = "{{this}}";
{{/each}}
neo::types::dialog_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  make_dialog_vector(
    {{#each (truncate this.text 27)}}
    {{../../prefix}}_{{@../index}}_line_{{@index}}{{#unless @last}},{{/unless}}
    {{/each}}
  )
);
{{else if (eq this.type "show-menu")}}
bn::string_view {{../prefix}}_{{@index}}_type = "show-menu";
{{#each this.choices}}
{{#if this.events.length}}
{{>eventsPartial prefix=(concat ../../prefix "_" @../index "_option_" @index "_event") events=this.events}}
neo::types::event* {{../../prefix}}_{{@../index}}_option_{{@index}}_events[] = {
  {{#each this.events}}
  &{{../../../prefix}}_{{@../../index}}_option_{{@../index}}_event_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
bn::string_view {{../../prefix}}_{{@../index}}_option_{{@index}}_text = "{{maxLen this.text 26}}";
neo::types::menu_choice {{../../prefix}}_{{@../index}}_option_{{@index}}_choice(
  {{../../prefix}}_{{@../index}}_option_{{@index}}_text,
  {{this.events.length}},
  {{#if this.events.length}}
  {{../../prefix}}_{{@../index}}_option_{{@index}}_events
  {{else}}
  nullptr
  {{/if}}
);
{{/each}}
neo::types::menu_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{valuedef (len (longestMenuChoice this.choices)) 0}},
  {{valuedef this.choices.length 0}},
  neo::types::direction::{{uppercase (valuedef this.direction 'down_right')}},
  {{valuedef this.z 1}},
  make_menu_vector(
    {{#each this.choices}}
    {{../../prefix}}_{{@../index}}_option_{{@index}}_choice{{#unless @last}},{{/unless}}
    {{/each}}
  )
);
{{else if (eq this.type "set-variable")}}
bn::string_view {{../prefix}}_{{@index}}_variable_name = {{#with (getVariable @root/variables this.name) as | variable |}}"{{variable.name}}"{{/with}};
bn::string_view {{../prefix}}_{{@index}}_string_value = "{{this.value}}";
neo::variables::value {{../prefix}}_{{@index}}_value(
  {{../prefix}}_{{@index}}_variable_name,
  {{int this.value}},
  {{bool this.value}},
  {{../prefix}}_{{@index}}_string_value
);
bn::string_view {{../prefix}}_{{@index}}_type = "set-variable";
neo::types::set_variable_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_variable_name,
  &{{../prefix}}_{{@index}}_value
);
{{else if (eq this.type "if")}}
{{#if this.then.length}}
{{>eventsPartial prefix=(concat ../prefix "_" @index "_then") events=this.then}}
neo::types::event* {{../prefix}}_{{@index}}_then[] = {
  {{#each this.then}}
  &{{../../prefix}}_{{@../index}}_then_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
{{#if this.else.length}}
{{>eventsPartial prefix=(concat ../prefix "_" @index "_else") events=this.else}}
neo::types::event* {{../prefix}}_{{@index}}_else[] = {
  {{#each this.else}}
  &{{../../prefix}}_{{@../index}}_else_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
{{#if this.conditions.length}}
{{>ifConditionsPartial prefix=(concat ../prefix "_" @index "_condition") conditions=this.conditions}}
neo::types::if_condition* {{../prefix}}_{{@index}}_conditions[] = {
  {{#each this.conditions}}
  &{{../../prefix}}_{{@index}}_condition_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
bn::string_view {{../prefix}}_{{@index}}_type = "if";
neo::types::if_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{#if this.conditions.length}}
  {{this.conditions.length}},
  {{../prefix}}_{{@index}}_conditions,
  {{else}}
  0,
  nullptr,
  {{/if}}
  {{#if this.then.length}}
  {{this.then.length}},
  {{../prefix}}_{{@index}}_then,
  {{else}}
  0,
  nullptr,
  {{/if}}
  {{#if this.else.length}}
  {{this.else.length}},
  {{../prefix}}_{{@index}}_else
  {{else}}
  0,
  nullptr
  {{/if}}
);
{{else if (eq this.type "disable-actor")}}
bn::string_view {{../prefix}}_{{@index}}_type = "disable-actor";
bn::string_view {{../prefix}}_{{@index}}_actor = "{{this.actor}}";
neo::types::disable_actor_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_actor
);
{{else if (eq this.type "enable-actor")}}
bn::string_view {{../prefix}}_{{@index}}_type = "enable-actor";
bn::string_view {{../prefix}}_{{@index}}_actor = "{{this.actor}}";
neo::types::enable_actor_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_actor
);
{{else if (eq this.type "play-music")}}
bn::string_view {{../prefix}}_{{@index}}_type = "play-music";
bn::string_view {{../prefix}}_{{@index}}_music_name = "{{this.name}}";
neo::types::play_music_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_music_name,
  {{this.volume}},
  {{this.loop}}
);
{{else if (eq this.type "stop-music")}}
bn::string_view {{../prefix}}_{{@index}}_type = "stop-music";
neo::types::stop_music_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type
);
{{else if (eq this.type "play-sound")}}
bn::string_view {{../prefix}}_{{@index}}_type = "play-sound";
bn::string_view {{../prefix}}_{{@index}}_sound_name = "{{this.name}}";
neo::types::play_sound_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_sound_name,
  {{this.volume}},
  {{this.speed}},
  {{this.panning}},
  {{this.priority}}
);
{{else if (eq this.type "execute-script")}}
bn::string_view {{../prefix}}_{{@index}}_type = "execute-script";
bn::string_view {{../prefix}}_{{@index}}_script_name = "{{this.script}}";
neo::types::execute_script_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_script_name
);
{{else if (eq this.type "move-camera-to")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_x") value=(valuedef this.x 0)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_y") value=(valuedef this.y 0)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=(valuedef this.duration 200)}}
bn::string_view {{../prefix}}_{{@index}}_type = "move-camera-to";
bn::string_view {{../prefix}}_{{@index}}_direction_priority = "{{valuedef this.directionPriority "horizontal"}}";
neo::types::move_camera_to_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  &{{../prefix}}_{{@index}}_x_value,
  &{{../prefix}}_{{@index}}_y_value,
  &{{../prefix}}_{{@index}}_duration_value,
  {{valuedef this.allowDiagonal true}},
  {{../prefix}}_{{@index}}_direction_priority
);
{{else}}
bn::string_view {{../prefix}}_{{@index}}_type = "unknown:{{this.type}}";
neo::types::event {{../prefix}}_{{@index}}({{../prefix}}_{{@index}}_type);
{{/if}}
{{else}}
bn::string_view {{../prefix}}_{{@index}}_type = "disabled:{{this.type}}";
neo::types::event {{../prefix}}_{{@index}}({{../prefix}}_{{@index}}_type);
{{/if}}
{{/each}}
