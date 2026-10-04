{{#each events}}
// Event {{@index}}: {{this.type}}
{{#if (neq this.enabled false)}}
{{#if (eq this.type "wait")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=this.duration}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "wait";
BN_DATA_EWRAM neo::types::wait_event {{../prefix}}_{{@index}}({{../prefix}}_{{@index}}_type, &{{../prefix}}_{{@index}}_duration_value);
{{else if (eq this.type "fade-in")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=this.duration}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "fade-in";
BN_DATA_EWRAM neo::types::fade_event {{../prefix}}_{{@index}}({{../prefix}}_{{@index}}_type, &{{../prefix}}_{{@index}}_duration_value);
{{else if (eq this.type "fade-out")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=this.duration}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "fade-out";
BN_DATA_EWRAM neo::types::fade_event {{../prefix}}_{{@index}}({{../prefix}}_{{@index}}_type, &{{../prefix}}_{{@index}}_duration_value);
{{else if (or (eq this.type "wait-for-button") (eq this.type "on-button-press"))}}
{{#if (eq this.type "on-button-press")}}
{{#if this.events}}
{{>eventsPartial prefix=(concat ../prefix "_" @index "_event") events=this.events}}
{{/if}}
constexpr neo::types::event* {{../prefix}}_{{@index}}_events[] = {
  {{#each this.events}}
  &{{../../prefix}}_{{@../index}}_event_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "{{this.type}}";
{{#each this.buttons}}
constexpr bn::string_view {{../../prefix}}_{{@../index}}_button_{{@index}} = "{{this}}";
{{/each}}
BN_DATA_EWRAM neo::types::button_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{valuedef this.every false}},
  make_button_vector(
    {{#each this.buttons}}
    {{../../prefix}}_{{@../index}}_button_{{@index}}{{#unless @last}},{{/unless}}
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
{{else if (eq this.type "disable-input")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "disable-input";
BN_DATA_EWRAM neo::types::input_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type
);
{{else if (eq this.type "enable-input")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "enable-input";
BN_DATA_EWRAM neo::types::input_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type
);
{{else if (eq this.type "save-game")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "save-game";
BN_DATA_EWRAM neo::types::save_game_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type
);
{{else if (eq this.type "load-game")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "load-game";
BN_DATA_EWRAM neo::types::load_game_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type
);
{{else if (eq this.type "save-state")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "save-state";
BN_DATA_EWRAM neo::types::save_state_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type
);
{{else if (eq this.type "load-state")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "load-state";
BN_DATA_EWRAM neo::types::load_state_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type
);
{{else if (eq this.type "go-to-scene")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_start_x") value=(valuedef this.start.x -1)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_start_y") value=(valuedef this.start.y -1)}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "go-to-scene";
constexpr bn::string_view {{../prefix}}_{{@index}}_target = "{{this.target}}";
BN_DATA_EWRAM neo::types::scene_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_target,
  &{{../prefix}}_{{@index}}_start_x_value,
  &{{../prefix}}_{{@index}}_start_y_value,
  neo::types::direction::{{uppercase (valuedef this.start.direction 'down')}}
);
{{else if (eq this.type "show-dialog")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "show-dialog";
{{#each (truncate this.text (dialogLineLength this.portrait))}}
constexpr bn::string_view {{../../prefix}}_{{@../index}}_line_{{@index}} = "{{escapeCpp this}}";
{{/each}}
BN_DATA_EWRAM neo::types::dialog_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  neo::types::direction::{{uppercase (valuedef this.direction 'down')}},
  {{valuedef this.z 1}},
  neo::types::text_speed::{{uppercase (valuedef this.speed 'normal')}},
  {{#if this.portrait}}
  &bn::sprite_items::{{getSpriteName @root/sprites this.portrait}},
  {{else}}
  nullptr,
  {{/if}}
  neo::types::dialog_portrait_position::{{uppercase (valuedef this.portraitPosition 'left')}},
  make_dialog_vector(
    {{#each (truncate this.text (dialogLineLength this.portrait))}}
    {{../../prefix}}_{{@../index}}_line_{{@index}}{{#unless @last}},{{/unless}}
    {{/each}}
  )
);
{{else if (eq this.type "show-menu")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "show-menu";
{{#each this.choices}}
{{#if this.events.length}}
{{>eventsPartial prefix=(concat ../../prefix "_" @../index "_option_" @index "_event") events=this.events}}
constexpr neo::types::event* {{../../prefix}}_{{@../index}}_option_{{@index}}_events[] = {
  {{#each this.events}}
  &{{../../../prefix}}_{{@../../index}}_option_{{@../index}}_event_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
{{#if this.conditions.length}}
{{>ifConditionsPartial prefix=(concat ../../prefix "_" @../index "_option_" @index "_condition") conditions=this.conditions}}
constexpr neo::types::if_condition* {{../../prefix}}_{{@../index}}_option_{{@index}}_conditions[] = {
  {{#each this.conditions}}
  &{{../../../prefix}}_{{@../../index}}_option_{{@../index}}_condition_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
constexpr bn::string_view {{../../prefix}}_{{@../index}}_option_{{@index}}_text = "{{escapeCpp (maxLen this.text 26)}}";
BN_DATA_EWRAM neo::types::menu_choice {{../../prefix}}_{{@../index}}_option_{{@index}}_choice(
  {{../../prefix}}_{{@../index}}_option_{{@index}}_text,
  {{this.events.length}},
  {{#if this.events.length}}
  {{../../prefix}}_{{@../index}}_option_{{@index}}_events,
  {{else}}
  nullptr,
  {{/if}}
  {{#if this.conditions.length}}
  {{this.conditions.length}},
  {{../../prefix}}_{{@../index}}_option_{{@index}}_conditions
  {{else}}
  0,
  nullptr
  {{/if}}
);
{{/each}}
BN_DATA_EWRAM neo::types::menu_event {{../prefix}}_{{@index}}(
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
constexpr bn::string_view {{../prefix}}_{{@index}}_variable_name = {{#with (getVariable @root/variables this.name) as | variable |}}"{{variable.name}}"{{/with}};
constexpr bn::string_view {{../prefix}}_{{@index}}_string_value = "{{escapeCpp this.value}}";
constexpr neo::variables::value {{../prefix}}_{{@index}}_value(
  {{../prefix}}_{{@index}}_variable_name,
  {{int this.value}},
  {{bool this.value}},
  {{../prefix}}_{{@index}}_string_value
);
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "set-variable";
BN_DATA_EWRAM neo::types::set_variable_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_variable_name,
  &{{../prefix}}_{{@index}}_value,
  neo::types::variable_operation::{{uppercase (valuedef this.operation 'set')}}
);
{{else if (eq this.type "if")}}
{{#if this.then.length}}
{{>eventsPartial prefix=(concat ../prefix "_" @index "_then") events=this.then}}
constexpr neo::types::event* {{../prefix}}_{{@index}}_then[] = {
  {{#each this.then}}
  &{{../../prefix}}_{{@../index}}_then_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
{{#if this.else.length}}
{{>eventsPartial prefix=(concat ../prefix "_" @index "_else") events=this.else}}
constexpr neo::types::event* {{../prefix}}_{{@index}}_else[] = {
  {{#each this.else}}
  &{{../../prefix}}_{{@../index}}_else_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
{{#if this.conditions.length}}
{{>ifConditionsPartial prefix=(concat ../prefix "_" @index "_condition") conditions=this.conditions}}
constexpr neo::types::if_condition* {{../prefix}}_{{@index}}_conditions[] = {
  {{#each this.conditions}}
  &{{../../prefix}}_{{@../index}}_condition_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "if";
BN_DATA_EWRAM neo::types::if_event {{../prefix}}_{{@index}}(
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
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "disable-actor";
constexpr bn::string_view {{../prefix}}_{{@index}}_actor = "{{this.actor}}";
BN_DATA_EWRAM neo::types::disable_actor_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_actor
);
{{else if (eq this.type "enable-actor")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "enable-actor";
constexpr bn::string_view {{../prefix}}_{{@index}}_actor = "{{this.actor}}";
BN_DATA_EWRAM neo::types::enable_actor_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_actor
);
{{else if (eq this.type "disable-sprite")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "disable-sprite";
constexpr bn::string_view {{../prefix}}_{{@index}}_sprite = "{{this.sprite}}";
BN_DATA_EWRAM neo::types::disable_sprite_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_sprite
);
{{else if (eq this.type "enable-sprite")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "enable-sprite";
constexpr bn::string_view {{../prefix}}_{{@index}}_sprite = "{{this.sprite}}";
BN_DATA_EWRAM neo::types::enable_sprite_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_sprite
);
{{else if (eq this.type "play-music")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "play-music";
constexpr bn::string_view {{../prefix}}_{{@index}}_music_name = "{{getMusicName @root/music this.name}}";
BN_DATA_EWRAM neo::types::play_music_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_music_name,
  {{this.volume}},
  {{this.loop}}
);
{{else if (eq this.type "stop-music")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "stop-music";
BN_DATA_EWRAM neo::types::stop_music_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type
);
{{else if (eq this.type "play-sound")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "play-sound";
constexpr bn::string_view {{../prefix}}_{{@index}}_sound_name = "{{getSoundName @root/sounds this.name}}";
BN_DATA_EWRAM neo::types::play_sound_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_sound_name,
  {{this.volume}},
  {{this.speed}},
  {{this.panning}},
  {{this.priority}}
);
{{else if (eq this.type "execute-script")}}
{{#if this.parameters.length}}
{{#each this.parameters}}
{{>valuePartial prefix=(concat ../../prefix "_" @../index "_argument_" @index) value=this}}
{{/each}}
constexpr const neo::types::event_value* {{../prefix}}_{{@index}}_arguments[] = {
  {{#each this.parameters}}
  &{{../../prefix}}_{{@../index}}_argument_{{@index}}_value{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "execute-script";
constexpr bn::string_view {{../prefix}}_{{@index}}_script_name = "{{this.script}}";
BN_DATA_EWRAM neo::types::execute_script_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_script_name,
  {{valuedef this.parameters.length 0}},
  {{#if this.parameters.length}}
  {{../prefix}}_{{@index}}_arguments
  {{else}}
  nullptr
  {{/if}}
);
{{else if (eq this.type "parallel-events")}}
{{#if this.events.length}}
{{>eventsPartial prefix=(concat ../prefix "_" @index "_event") events=this.events}}
constexpr neo::types::event* {{../prefix}}_{{@index}}_events[] = {
  {{#each this.events}}
  &{{../../prefix}}_{{@../index}}_event_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "parallel-events";
BN_DATA_EWRAM neo::types::parallel_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{valuedef this.events.length 0}},
  {{#if this.events.length}}
  {{../prefix}}_{{@index}}_events
  {{else}}
  nullptr
  {{/if}}
);
{{else if (eq this.type "set-palette-effect")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=(valuedef this.duration 200)}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "set-palette-effect";
constexpr bn::string_view {{../prefix}}_{{@index}}_target = "{{valuedef this.target "both"}}";
constexpr bn::string_view {{../prefix}}_{{@index}}_effect = "{{valuedef this.effect "grayscale"}}";
BN_DATA_EWRAM neo::types::set_palette_effect_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_target,
  {{../prefix}}_{{@index}}_effect,
  {{valuedef this.value 100}},
  &{{../prefix}}_{{@index}}_duration_value
);
{{else if (eq this.type "wave-effect")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=(valuedef this.duration 0)}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "wave-effect";
constexpr bn::string_view {{../prefix}}_{{@index}}_target = "{{valuedef this.target "both"}}";
constexpr bn::string_view {{../prefix}}_{{@index}}_envelope = "{{valuedef this.envelope "in"}}";
BN_DATA_EWRAM neo::types::wave_effect_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_target,
  {{valuedef this.amplitude 4}},
  {{valuedef this.speed 4}},
  {{valuedef this.frequency 1}},
  &{{../prefix}}_{{@index}}_duration_value,
  {{../prefix}}_{{@index}}_envelope
);
{{else if (eq this.type "move-camera-to")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_x") value=(valuedef this.x 0)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_y") value=(valuedef this.y 0)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=(valuedef this.duration 200)}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "move-camera-to";
constexpr bn::string_view {{../prefix}}_{{@index}}_direction_priority = "{{valuedef this.directionPriority "horizontal"}}";
BN_DATA_EWRAM neo::types::move_camera_to_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  &{{../prefix}}_{{@index}}_x_value,
  &{{../prefix}}_{{@index}}_y_value,
  &{{../prefix}}_{{@index}}_duration_value,
  {{valuedef this.allowDiagonal true}},
  {{../prefix}}_{{@index}}_direction_priority
);
{{else if (eq this.type "follow-actor")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=(valuedef this.duration 200)}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "follow-actor";
constexpr bn::string_view {{../prefix}}_{{@index}}_actor = "{{this.actor}}";
constexpr bn::string_view {{../prefix}}_{{@index}}_direction_priority = "{{valuedef this.directionPriority "horizontal"}}";
BN_DATA_EWRAM neo::types::follow_actor_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_actor,
  &{{../prefix}}_{{@index}}_duration_value,
  {{valuedef this.allowDiagonal true}},
  {{../prefix}}_{{@index}}_direction_priority
);
{{else if (eq this.type "follow-player")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=(valuedef this.duration 200)}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "follow-player";
constexpr bn::string_view {{../prefix}}_{{@index}}_direction_priority = "{{valuedef this.directionPriority "horizontal"}}";
BN_DATA_EWRAM neo::types::follow_player_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  &{{../prefix}}_{{@index}}_duration_value,
  {{valuedef this.allowDiagonal true}},
  {{../prefix}}_{{@index}}_direction_priority
);
{{else if (eq this.type "freeze-camera")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "freeze-camera";
BN_DATA_EWRAM neo::types::freeze_camera_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type
);
{{else if (eq this.type "disable-player")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "disable-player";
BN_DATA_EWRAM neo::types::player_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type
);
{{else if (eq this.type "enable-player")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "enable-player";
BN_DATA_EWRAM neo::types::player_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type
);
{{else if (eq this.type "move-actor-to")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_x") value=(valuedef this.x 0)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_y") value=(valuedef this.y 0)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_speed") value=(valuedef this.speed 2)}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "move-actor-to";
constexpr bn::string_view {{../prefix}}_{{@index}}_actor = "{{this.actor}}";
constexpr bn::string_view {{../prefix}}_{{@index}}_direction_priority = "{{valuedef this.directionPriority "horizontal"}}";
constexpr bn::string_view {{../prefix}}_{{@index}}_animation = "{{valuedef this.animation ""}}";
BN_DATA_EWRAM neo::types::move_actor_to_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_actor,
  &{{../prefix}}_{{@index}}_x_value,
  &{{../prefix}}_{{@index}}_y_value,
  &{{../prefix}}_{{@index}}_speed_value,
  {{../prefix}}_{{@index}}_direction_priority,
  {{../prefix}}_{{@index}}_animation,
  {{valuedef this.backwards false}}
);
{{else if (eq this.type "move-player-to")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_x") value=(valuedef this.x 0)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_y") value=(valuedef this.y 0)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_speed") value=(valuedef this.speed 2)}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "move-player-to";
constexpr bn::string_view {{../prefix}}_{{@index}}_direction_priority = "{{valuedef this.directionPriority "horizontal"}}";
constexpr bn::string_view {{../prefix}}_{{@index}}_animation = "{{valuedef this.animation ""}}";
BN_DATA_EWRAM neo::types::move_player_to_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  &{{../prefix}}_{{@index}}_x_value,
  &{{../prefix}}_{{@index}}_y_value,
  &{{../prefix}}_{{@index}}_speed_value,
  {{../prefix}}_{{@index}}_direction_priority,
  {{../prefix}}_{{@index}}_animation,
  {{valuedef this.backwards false}}
);
{{else if (eq this.type "set-actor-position")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_x") value=(valuedef this.x 0)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_y") value=(valuedef this.y 0)}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "set-actor-position";
constexpr bn::string_view {{../prefix}}_{{@index}}_actor = "{{this.actor}}";
BN_DATA_EWRAM neo::types::set_actor_position_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_actor,
  &{{../prefix}}_{{@index}}_x_value,
  &{{../prefix}}_{{@index}}_y_value
);
{{else if (eq this.type "set-player-position")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_x") value=(valuedef this.x 0)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_y") value=(valuedef this.y 0)}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "set-player-position";
BN_DATA_EWRAM neo::types::set_player_position_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  &{{../prefix}}_{{@index}}_x_value,
  &{{../prefix}}_{{@index}}_y_value
);
{{else if (eq this.type "set-actor-direction")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "set-actor-direction";
constexpr bn::string_view {{../prefix}}_{{@index}}_actor = "{{this.actor}}";
BN_DATA_EWRAM neo::types::direction {{../prefix}}_{{@index}}_direction = neo::types::direction::{{uppercase (valuedef this.direction 'down')}};
BN_DATA_EWRAM neo::types::set_actor_direction_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_actor,
  {{../prefix}}_{{@index}}_direction
);
{{else if (eq this.type "set-player-direction")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "set-player-direction";
BN_DATA_EWRAM neo::types::direction {{../prefix}}_{{@index}}_direction = neo::types::direction::{{uppercase (valuedef this.direction 'down')}};
BN_DATA_EWRAM neo::types::set_player_direction_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_direction
);
{{else if (eq this.type "set-background")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "set-background";
BN_DATA_EWRAM neo::types::set_background_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  bn::regular_bg_items::{{getBackgroundName @root/backgrounds (valuedef this.background "bg_default")}}
);
{{else if (eq this.type "set-sprite")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "set-sprite";
constexpr bn::string_view {{../prefix}}_{{@index}}_sprite = "{{this.sprite}}";
BN_DATA_EWRAM neo::types::set_sprite_event {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_sprite,
  bn::sprite_items::{{getSpriteName @root/sprites (valuedef this.asset "sprite_default")}}
);
{{else}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "unknown:{{this.type}}";
BN_DATA_EWRAM neo::types::event {{../prefix}}_{{@index}}({{../prefix}}_{{@index}}_type);
{{/if}}
{{else}}
constexpr bn::string_view {{../prefix}}_{{@index}}_type = "disabled:{{this.type}}";
BN_DATA_EWRAM neo::types::event {{../prefix}}_{{@index}}({{../prefix}}_{{@index}}_type);
{{/if}}
{{/each}}
