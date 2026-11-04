{{!-- Events with runtime state (fade, parallel, palette, wave, move-*) or bn::vector members stay BN_DATA_EWRAM, the rest is constexpr (ROM) --}}
{{#each events}}
// Event {{@index}}: {{this.type}}
{{#if (neq this.enabled false)}}
{{#if (eq this.type "wait")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=this.duration}}
constexpr neo::types::wait_event {{../prefix}}_{{@index}}(neo::types::event_type::WAIT, &{{../prefix}}_{{@index}}_duration_value);
{{else if (eq this.type "fade-in")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=this.duration}}
BN_DATA_EWRAM neo::types::fade_event {{../prefix}}_{{@index}}(neo::types::event_type::FADE_IN, &{{../prefix}}_{{@index}}_duration_value);
{{else if (eq this.type "fade-out")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=this.duration}}
BN_DATA_EWRAM neo::types::fade_event {{../prefix}}_{{@index}}(neo::types::event_type::FADE_OUT, &{{../prefix}}_{{@index}}_duration_value);
{{else if (or (eq this.type "wait-for-button") (eq this.type "on-button-press"))}}
{{#if (and (eq this.type "on-button-press") (hasItems this.events))}}
{{>eventsPartial prefix=(concat ../prefix "_" @index "_event") events=this.events}}
constexpr const neo::types::event* {{../prefix}}_{{@index}}_events[] = {
  {{#each this.events}}
  &{{../../prefix}}_{{@../index}}_event_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
{{#if this.buttons.length}}
constexpr bn::string_view {{../prefix}}_{{@index}}_buttons[] = {
  {{#each this.buttons}}
  "{{this}}"{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
constexpr neo::types::button_event {{../prefix}}_{{@index}}(
  neo::types::event_type::{{#if (eq this.type "on-button-press")}}ON_BUTTON_PRESS{{else}}WAIT_FOR_BUTTON{{/if}},
  {{valuedef this.every false}},
  {{#if this.buttons.length}}
  bn::span<const bn::string_view>({{../prefix}}_{{@index}}_buttons),
  {{else}}
  bn::span<const bn::string_view>(),
  {{/if}}
  {{#if (and (eq this.type "on-button-press") (hasItems this.events))}}
  {{this.events.length}},
  {{../prefix}}_{{@index}}_events
  {{else}}
  0,
  nullptr
  {{/if}}
);
{{else if (eq this.type "disable-input")}}
constexpr neo::types::input_event {{../prefix}}_{{@index}}(
  neo::types::event_type::DISABLE_INPUT
);
{{else if (eq this.type "enable-input")}}
constexpr neo::types::input_event {{../prefix}}_{{@index}}(
  neo::types::event_type::ENABLE_INPUT
);
{{else if (eq this.type "save-game")}}
constexpr neo::types::save_game_event {{../prefix}}_{{@index}}(
  neo::types::event_type::SAVE_GAME
);
{{else if (eq this.type "load-game")}}
constexpr neo::types::load_game_event {{../prefix}}_{{@index}}(
  neo::types::event_type::LOAD_GAME
);
{{else if (eq this.type "save-state")}}
constexpr neo::types::save_state_event {{../prefix}}_{{@index}}(
  neo::types::event_type::SAVE_STATE
);
{{else if (eq this.type "reset-game")}}
constexpr neo::types::reset_game_event {{../prefix}}_{{@index}}(
  neo::types::event_type::RESET_GAME
);
{{else if (eq this.type "load-state")}}
constexpr neo::types::load_state_event {{../prefix}}_{{@index}}(
  neo::types::event_type::LOAD_STATE
);
{{else if (eq this.type "go-to-scene")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_start_x") value=(valuedef this.start.x -1)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_start_y") value=(valuedef this.start.y -1)}}
constexpr bn::string_view {{../prefix}}_{{@index}}_target = "{{this.target}}";
constexpr neo::types::scene_event {{../prefix}}_{{@index}}(
  neo::types::event_type::GO_TO_SCENE,
  {{../prefix}}_{{@index}}_target,
  &{{../prefix}}_{{@index}}_start_x_value,
  &{{../prefix}}_{{@index}}_start_y_value,
  neo::types::direction::{{uppercase (valuedef this.start.direction 'down')}}
);
{{else if (eq this.type "show-dialog")}}
{{#each (truncate this.text (dialogLineLength this.portrait))}}
constexpr bn::string_view {{../../prefix}}_{{@../index}}_line_{{@index}} = "{{escapeCpp this}}";
{{/each}}
{{#if (hasItems (truncate this.text (dialogLineLength this.portrait)))}}
constexpr bn::string_view {{../prefix}}_{{@index}}_lines[] = {
  {{#each (truncate this.text (dialogLineLength this.portrait))}}
  {{../../prefix}}_{{@../index}}_line_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
{{#if (isset this.textColor)}}
constexpr bn::color {{../prefix}}_{{@index}}_text_color = { {{colorRGB this.textColor}} };
{{/if}}
constexpr neo::types::dialog_event {{../prefix}}_{{@index}}(
  neo::types::event_type::SHOW_DIALOG,
  neo::types::direction::{{uppercase (valuedef this.direction 'down')}},
  {{valuedef this.z 1}},
  neo::types::text_speed::{{uppercase (valuedef this.speed 'normal')}},
  {{#if this.portrait}}
  &bn::sprite_items::{{getSpriteName @root/sprites this.portrait}},
  {{else}}
  nullptr,
  {{/if}}
  neo::types::dialog_portrait_position::{{uppercase (valuedef this.portraitPosition 'left')}},
  {{#if (hasFont @root/fonts this.font)}}
  &bn::sprite_items::{{getFontName @root/fonts this.font}},
  {{else}}
  nullptr,
  {{/if}}
  {{#if (isset this.textColor)}}
  &{{../prefix}}_{{@index}}_text_color,
  {{else}}
  nullptr,
  {{/if}}
  {{#if (isset this.background)}}
  &bn::sprite_items::{{getSpriteName @root/sprites this.background}},
  {{else}}
  nullptr,
  {{/if}}
  {{#if (hasItems (truncate this.text (dialogLineLength this.portrait)))}}
  bn::span<const bn::string_view>({{../prefix}}_{{@index}}_lines)
  {{else}}
  bn::span<const bn::string_view>()
  {{/if}}
);
{{else if (eq this.type "show-menu")}}
{{#each this.choices}}
{{#if this.events.length}}
{{>eventsPartial prefix=(concat ../../prefix "_" @../index "_option_" @index "_event") events=this.events}}
constexpr const neo::types::event* {{../../prefix}}_{{@../index}}_option_{{@index}}_events[] = {
  {{#each this.events}}
  &{{../../../prefix}}_{{@../../index}}_option_{{@../index}}_event_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
{{#if this.conditions.length}}
{{>ifConditionsPartial prefix=(concat ../../prefix "_" @../index "_option_" @index "_condition") conditions=this.conditions}}
constexpr const neo::types::if_condition* {{../../prefix}}_{{@../index}}_option_{{@index}}_conditions[] = {
  {{#each this.conditions}}
  &{{../../../prefix}}_{{@../../index}}_option_{{@../index}}_condition_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
constexpr bn::string_view {{../../prefix}}_{{@../index}}_option_{{@index}}_text = "{{escapeCpp (maxLen this.text 26)}}";
{{/each}}
{{#if this.choices.length}}
constexpr neo::types::menu_choice {{../prefix}}_{{@index}}_choices[] = {
  {{#each this.choices}}
  neo::types::menu_choice(
    {{../../prefix}}_{{@../index}}_option_{{@index}}_text,
    {{valuedef this.events.length 0}},
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
  ){{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
{{#if (isset this.textColor)}}
constexpr bn::color {{../prefix}}_{{@index}}_text_color = { {{colorRGB this.textColor}} };
{{/if}}
constexpr neo::types::menu_event {{../prefix}}_{{@index}}(
  neo::types::event_type::SHOW_MENU,
  {{valuedef (len (longestMenuChoice this.choices)) 0}},
  {{valuedef this.choices.length 0}},
  neo::types::direction::{{uppercase (valuedef this.direction 'down_right')}},
  {{valuedef this.z 1}},
  {{#if (hasFont @root/fonts this.font)}}
  &bn::sprite_items::{{getFontName @root/fonts this.font}},
  {{else}}
  nullptr,
  {{/if}}
  {{#if (isset this.textColor)}}
  &{{../prefix}}_{{@index}}_text_color,
  {{else}}
  nullptr,
  {{/if}}
  {{#if (isset this.background)}}
  &bn::sprite_items::{{getSpriteName @root/sprites this.background}},
  {{else}}
  nullptr,
  {{/if}}
  {{#if this.choices.length}}
  bn::span<const neo::types::menu_choice>({{../prefix}}_{{@index}}_choices)
  {{else}}
  bn::span<const neo::types::menu_choice>()
  {{/if}}
);
{{else if (eq this.type "set-hud-text")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_content") value=this.value}}
constexpr bn::string_view {{../prefix}}_{{@index}}_hud = "{{escapeCpp this.hud}}";
constexpr bn::string_view {{../prefix}}_{{@index}}_text = "{{escapeCpp this.text}}";
constexpr neo::types::set_hud_text_event {{../prefix}}_{{@index}}(
  neo::types::event_type::SET_HUD_TEXT,
  {{../prefix}}_{{@index}}_hud,
  {{../prefix}}_{{@index}}_text,
  &{{../prefix}}_{{@index}}_content_value
);
{{else if (eq this.type "on-variable-change")}}
{{#if (hasItems this.events)}}
{{>eventsPartial prefix=(concat ../prefix "_" @index "_event") events=this.events}}
constexpr const neo::types::event* {{../prefix}}_{{@index}}_events[] = {
  {{#each this.events}}
  &{{../../prefix}}_{{@../index}}_event_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
constexpr bn::string_view {{../prefix}}_{{@index}}_variable_name = {{#with (getVariable @root/variables this.variable) as | variable |}}"{{variable.name}}"{{else}}""{{/with}};
constexpr neo::types::variable_change_event {{../prefix}}_{{@index}}(
  neo::types::event_type::ON_VARIABLE_CHANGE,
  {{../prefix}}_{{@index}}_variable_name,
  {{#if (hasItems this.events)}}
  {{this.events.length}},
  {{../prefix}}_{{@index}}_events
  {{else}}
  0,
  nullptr
  {{/if}}
);
{{else if (eq this.type "on-out-of-camera-bounds")}}
{{#if (hasItems this.events)}}
{{>eventsPartial prefix=(concat ../prefix "_" @index "_event") events=this.events}}
constexpr const neo::types::event* {{../prefix}}_{{@index}}_events[] = {
  {{#each this.events}}
  &{{../../prefix}}_{{@../index}}_event_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
constexpr neo::types::camera_bounds_event {{../prefix}}_{{@index}}(
  neo::types::event_type::ON_OUT_OF_CAMERA_BOUNDS,
  {{#if (hasItems this.events)}}
  {{this.events.length}},
  {{../prefix}}_{{@index}}_events
  {{else}}
  0,
  nullptr
  {{/if}}
);
{{else if (eq this.type "set-variable")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_variable_name = {{#with (getVariable @root/variables this.name) as | variable |}}"{{variable.name}}"{{/with}};
constexpr bn::string_view {{../prefix}}_{{@index}}_string_value = "{{escapeCpp this.value}}";
constexpr neo::variables::value {{../prefix}}_{{@index}}_value(
  {{../prefix}}_{{@index}}_variable_name,
  {{int this.value}},
  {{bool this.value}},
  {{../prefix}}_{{@index}}_string_value,
  {{fixed this.value}}
);
constexpr neo::types::set_variable_event {{../prefix}}_{{@index}}(
  neo::types::event_type::SET_VARIABLE,
  {{../prefix}}_{{@index}}_variable_name,
  &{{../prefix}}_{{@index}}_value,
  neo::types::variable_operation::{{uppercase (valuedef this.operation 'set')}}
);
{{else if (eq this.type "if")}}
{{#if this.then.length}}
{{>eventsPartial prefix=(concat ../prefix "_" @index "_then") events=this.then}}
constexpr const neo::types::event* {{../prefix}}_{{@index}}_then[] = {
  {{#each this.then}}
  &{{../../prefix}}_{{@../index}}_then_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
{{#if this.else.length}}
{{>eventsPartial prefix=(concat ../prefix "_" @index "_else") events=this.else}}
constexpr const neo::types::event* {{../prefix}}_{{@index}}_else[] = {
  {{#each this.else}}
  &{{../../prefix}}_{{@../index}}_else_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
{{#if this.conditions.length}}
{{>ifConditionsPartial prefix=(concat ../prefix "_" @index "_condition") conditions=this.conditions}}
constexpr const neo::types::if_condition* {{../prefix}}_{{@index}}_conditions[] = {
  {{#each this.conditions}}
  &{{../../prefix}}_{{@../index}}_condition_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
constexpr neo::types::if_event {{../prefix}}_{{@index}}(
  neo::types::event_type::IF,
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
constexpr bn::string_view {{../prefix}}_{{@index}}_actor = "{{this.actor}}";
constexpr neo::types::disable_actor_event {{../prefix}}_{{@index}}(
  neo::types::event_type::DISABLE_ACTOR,
  {{../prefix}}_{{@index}}_actor
);
{{else if (eq this.type "enable-actor")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_actor = "{{this.actor}}";
constexpr neo::types::enable_actor_event {{../prefix}}_{{@index}}(
  neo::types::event_type::ENABLE_ACTOR,
  {{../prefix}}_{{@index}}_actor
);
{{else if (eq this.type "disable-sprite")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_sprite = "{{this.sprite}}";
constexpr neo::types::disable_sprite_event {{../prefix}}_{{@index}}(
  neo::types::event_type::DISABLE_SPRITE,
  {{../prefix}}_{{@index}}_sprite
);
{{else if (eq this.type "enable-sprite")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_sprite = "{{this.sprite}}";
constexpr neo::types::enable_sprite_event {{../prefix}}_{{@index}}(
  neo::types::event_type::ENABLE_SPRITE,
  {{../prefix}}_{{@index}}_sprite
);
{{else if (eq this.type "play-music")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_music_name = "{{getMusicName @root/music this.name}}";
constexpr neo::types::play_music_event {{../prefix}}_{{@index}}(
  neo::types::event_type::PLAY_MUSIC,
  {{../prefix}}_{{@index}}_music_name,
  {{this.volume}},
  {{this.loop}}
);
{{else if (eq this.type "stop-music")}}
constexpr neo::types::stop_music_event {{../prefix}}_{{@index}}(
  neo::types::event_type::STOP_MUSIC
);
{{else if (eq this.type "play-sound")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_sound_name = "{{getSoundName @root/sounds this.name}}";
constexpr neo::types::play_sound_event {{../prefix}}_{{@index}}(
  neo::types::event_type::PLAY_SOUND,
  {{../prefix}}_{{@index}}_sound_name,
  {{this.volume}},
  {{this.speed}},
  {{this.pan}},
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
constexpr bn::string_view {{../prefix}}_{{@index}}_script_name = "{{this.script}}";
constexpr neo::types::execute_script_event {{../prefix}}_{{@index}}(
  neo::types::event_type::EXECUTE_SCRIPT,
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
constexpr const neo::types::event* {{../prefix}}_{{@index}}_events[] = {
  {{#each this.events}}
  &{{../../prefix}}_{{@../index}}_event_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
BN_DATA_EWRAM neo::types::parallel_event {{../prefix}}_{{@index}}(
  neo::types::event_type::PARALLEL_EVENTS,
  {{valuedef this.events.length 0}},
  {{#if this.events.length}}
  {{../prefix}}_{{@index}}_events
  {{else}}
  nullptr
  {{/if}}
);
{{else if (eq this.type "set-palette-effect")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=(valuedef this.duration 200)}}
constexpr bn::string_view {{../prefix}}_{{@index}}_target = "{{valuedef this.target "both"}}";
constexpr bn::string_view {{../prefix}}_{{@index}}_effect = "{{valuedef this.effect "grayscale"}}";
BN_DATA_EWRAM neo::types::set_palette_effect_event {{../prefix}}_{{@index}}(
  neo::types::event_type::SET_PALETTE_EFFECT,
  {{../prefix}}_{{@index}}_target,
  {{../prefix}}_{{@index}}_effect,
  {{valuedef this.value 100}},
  &{{../prefix}}_{{@index}}_duration_value
);
{{else if (eq this.type "wave-effect")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=(valuedef this.duration 0)}}
constexpr bn::string_view {{../prefix}}_{{@index}}_target = "{{valuedef this.target "both"}}";
constexpr bn::string_view {{../prefix}}_{{@index}}_envelope = "{{valuedef this.envelope "in"}}";
BN_DATA_EWRAM neo::types::wave_effect_event {{../prefix}}_{{@index}}(
  neo::types::event_type::WAVE_EFFECT,
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
constexpr bn::string_view {{../prefix}}_{{@index}}_direction_priority = "{{valuedef this.directionPriority "horizontal"}}";
BN_DATA_EWRAM neo::types::move_camera_to_event {{../prefix}}_{{@index}}(
  neo::types::event_type::MOVE_CAMERA_TO,
  &{{../prefix}}_{{@index}}_x_value,
  &{{../prefix}}_{{@index}}_y_value,
  &{{../prefix}}_{{@index}}_duration_value,
  {{valuedef this.allowDiagonal true}},
  {{../prefix}}_{{@index}}_direction_priority
);
{{else if (eq this.type "follow-actor")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=(valuedef this.duration 200)}}
constexpr bn::string_view {{../prefix}}_{{@index}}_actor = "{{this.actor}}";
constexpr bn::string_view {{../prefix}}_{{@index}}_direction_priority = "{{valuedef this.directionPriority "horizontal"}}";
constexpr neo::types::follow_actor_event {{../prefix}}_{{@index}}(
  neo::types::event_type::FOLLOW_ACTOR,
  {{../prefix}}_{{@index}}_actor,
  &{{../prefix}}_{{@index}}_duration_value,
  {{valuedef this.allowDiagonal true}},
  {{../prefix}}_{{@index}}_direction_priority
);
{{else if (eq this.type "follow-player")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=(valuedef this.duration 200)}}
constexpr bn::string_view {{../prefix}}_{{@index}}_direction_priority = "{{valuedef this.directionPriority "horizontal"}}";
constexpr neo::types::follow_player_event {{../prefix}}_{{@index}}(
  neo::types::event_type::FOLLOW_PLAYER,
  &{{../prefix}}_{{@index}}_duration_value,
  {{valuedef this.allowDiagonal true}},
  {{../prefix}}_{{@index}}_direction_priority
);
{{else if (eq this.type "freeze-camera")}}
constexpr neo::types::freeze_camera_event {{../prefix}}_{{@index}}(
  neo::types::event_type::FREEZE_CAMERA
);
{{else if (eq this.type "disable-player")}}
constexpr neo::types::player_event {{../prefix}}_{{@index}}(
  neo::types::event_type::DISABLE_PLAYER
);
{{else if (eq this.type "enable-player")}}
constexpr neo::types::player_event {{../prefix}}_{{@index}}(
  neo::types::event_type::ENABLE_PLAYER
);
{{else if (eq this.type "move-actor-to")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_x") value=(valuedef this.x 0)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_y") value=(valuedef this.y 0)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_speed") value=(valuedef this.speed 2)}}
constexpr bn::string_view {{../prefix}}_{{@index}}_actor = "{{this.actor}}";
constexpr bn::string_view {{../prefix}}_{{@index}}_direction_priority = "{{valuedef this.directionPriority "horizontal"}}";
constexpr bn::string_view {{../prefix}}_{{@index}}_animation = "{{valuedef this.animation ""}}";
BN_DATA_EWRAM neo::types::move_actor_to_event {{../prefix}}_{{@index}}(
  neo::types::event_type::MOVE_ACTOR_TO,
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
constexpr bn::string_view {{../prefix}}_{{@index}}_direction_priority = "{{valuedef this.directionPriority "horizontal"}}";
constexpr bn::string_view {{../prefix}}_{{@index}}_animation = "{{valuedef this.animation ""}}";
BN_DATA_EWRAM neo::types::move_player_to_event {{../prefix}}_{{@index}}(
  neo::types::event_type::MOVE_PLAYER_TO,
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
constexpr bn::string_view {{../prefix}}_{{@index}}_actor = "{{this.actor}}";
constexpr neo::types::set_actor_position_event {{../prefix}}_{{@index}}(
  neo::types::event_type::SET_ACTOR_POSITION,
  {{../prefix}}_{{@index}}_actor,
  &{{../prefix}}_{{@index}}_x_value,
  &{{../prefix}}_{{@index}}_y_value
);
{{else if (eq this.type "set-player-position")}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_x") value=(valuedef this.x 0)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_y") value=(valuedef this.y 0)}}
constexpr neo::types::set_player_position_event {{../prefix}}_{{@index}}(
  neo::types::event_type::SET_PLAYER_POSITION,
  &{{../prefix}}_{{@index}}_x_value,
  &{{../prefix}}_{{@index}}_y_value
);
{{else if (eq this.type "set-actor-direction")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_actor = "{{this.actor}}";
constexpr neo::types::direction {{../prefix}}_{{@index}}_direction = neo::types::direction::{{uppercase (valuedef this.direction 'down')}};
constexpr neo::types::set_actor_direction_event {{../prefix}}_{{@index}}(
  neo::types::event_type::SET_ACTOR_DIRECTION,
  {{../prefix}}_{{@index}}_actor,
  {{../prefix}}_{{@index}}_direction
);
{{else if (eq this.type "set-player-direction")}}
constexpr neo::types::direction {{../prefix}}_{{@index}}_direction = neo::types::direction::{{uppercase (valuedef this.direction 'down')}};
constexpr neo::types::set_player_direction_event {{../prefix}}_{{@index}}(
  neo::types::event_type::SET_PLAYER_DIRECTION,
  {{../prefix}}_{{@index}}_direction
);
{{else if (eq this.type "set-background")}}
constexpr neo::types::set_background_event {{../prefix}}_{{@index}}(
  neo::types::event_type::SET_BACKGROUND,
  neo::backgrounds::{{getBackgroundName @root/backgrounds (valuedef this.background "bg_default")}}
);
{{else if (eq this.type "set-sprite")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_sprite = "{{this.sprite}}";
constexpr neo::types::set_sprite_event {{../prefix}}_{{@index}}(
  neo::types::event_type::SET_SPRITE,
  {{../prefix}}_{{@index}}_sprite,
  bn::sprite_items::{{getSpriteName @root/sprites (valuedef this.asset "sprite_default")}}
);
{{else if (eq this.type "set-player-animation")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_animation = "{{this.animation}}";
constexpr neo::types::set_player_animation_event {{../prefix}}_{{@index}}(
  neo::types::event_type::SET_PLAYER_ANIMATION,
  {{../prefix}}_{{@index}}_animation
);
{{else if (eq this.type "set-actor-animation")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_actor = "{{this.actor}}";
constexpr bn::string_view {{../prefix}}_{{@index}}_animation = "{{this.animation}}";
constexpr neo::types::set_actor_animation_event {{../prefix}}_{{@index}}(
  neo::types::event_type::SET_ACTOR_ANIMATION,
  {{../prefix}}_{{@index}}_actor,
  {{../prefix}}_{{@index}}_animation
);
{{else if (eq this.type "set-sprite-animation")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_sprite = "{{this.sprite}}";
constexpr bn::string_view {{../prefix}}_{{@index}}_animation = "{{this.animation}}";
constexpr neo::types::set_sprite_animation_event {{../prefix}}_{{@index}}(
  neo::types::event_type::SET_SPRITE_ANIMATION,
  {{../prefix}}_{{@index}}_sprite,
  {{../prefix}}_{{@index}}_animation
);
{{else if (eq this.type "stop-player-animation")}}
constexpr neo::types::player_event {{../prefix}}_{{@index}}(
  neo::types::event_type::STOP_PLAYER_ANIMATION
);
{{else if (eq this.type "stop-actor-animation")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_actor = "{{this.actor}}";
constexpr neo::types::stop_actor_animation_event {{../prefix}}_{{@index}}(
  neo::types::event_type::STOP_ACTOR_ANIMATION,
  {{../prefix}}_{{@index}}_actor
);
{{else if (eq this.type "stop-sprite-animation")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_sprite = "{{this.sprite}}";
constexpr neo::types::stop_sprite_animation_event {{../prefix}}_{{@index}}(
  neo::types::event_type::STOP_SPRITE_ANIMATION,
  {{../prefix}}_{{@index}}_sprite
);
{{else if (eq this.type "shoot-projectile")}}
constexpr bn::sprite_item {{../prefix}}_{{@index}}_sprite = bn::sprite_items::{{getSpriteName @root/sprites (valuedef this.sprite "sprite_default")}};
constexpr bn::string_view {{../prefix}}_{{@index}}_source_type = "{{this.sourceType}}";
constexpr bn::string_view {{../prefix}}_{{@index}}_actor = "{{this.actor}}";
constexpr bn::string_view {{../prefix}}_{{@index}}_animation = "{{this.animation}}";
constexpr neo::types::direction {{../prefix}}_{{@index}}_direction = neo::types::direction::{{uppercase (valuedef this.direction 'down')}};
constexpr neo::types::gravity_style {{../prefix}}_{{@index}}_gravity_style = neo::types::gravity_style::{{uppercase (valuedef this.gravityStyle 'normal')}};
{{>valuePartial prefix=(concat ../prefix "_" @index "_speed") value=(valuedef this.speed 3)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_lifetime") value=(valuedef this.lifetime 120)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_gravity") value=(valuedef this.gravity 0.2)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_gravity_angle") value=(valuedef this.gravityAngle 45)}}
{{>valuePartial prefix=(concat ../prefix "_" @index "_terminal_velocity") value=(valuedef this.terminalVelocity 100)}}
constexpr neo::types::shoot_projectile_event {{../prefix}}_{{@index}}(
  neo::types::event_type::SHOOT_PROJECTILE,
  {{../prefix}}_{{@index}}_sprite,
  {{../prefix}}_{{@index}}_source_type,
  {{../prefix}}_{{@index}}_actor,
  {{../prefix}}_{{@index}}_animation,
  {{../prefix}}_{{@index}}_direction,
  &{{../prefix}}_{{@index}}_speed_value,
  &{{../prefix}}_{{@index}}_lifetime_value,
  {{valuedef this.destroyOnCollision false}},
  {{valuedef this.collisionGroup 0}},
  {{valuedef this.hasGravity false}},
  {{../prefix}}_{{@index}}_gravity_style,
  &{{../prefix}}_{{@index}}_gravity_value,
  &{{../prefix}}_{{@index}}_gravity_angle_value,
  &{{../prefix}}_{{@index}}_terminal_velocity_value
);
{{else if (eq this.type "melee-attack")}}
constexpr bn::sprite_item {{../prefix}}_{{@index}}_sprite = bn::sprite_items::{{getSpriteName @root/sprites (valuedef this.sprite "sprite_default")}};
constexpr bn::string_view {{../prefix}}_{{@index}}_source_type = "{{this.sourceType}}";
constexpr bn::string_view {{../prefix}}_{{@index}}_actor = "{{this.actor}}";
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=(valuedef this.duration 200)}}
constexpr neo::types::melee_attack_event {{../prefix}}_{{@index}}(
  neo::types::event_type::MELEE_ATTACK,
  {{../prefix}}_{{@index}}_sprite,
  {{../prefix}}_{{@index}}_source_type,
  {{../prefix}}_{{@index}}_actor,
  &{{../prefix}}_{{@index}}_duration_value
);
{{else if (eq this.type "show-actor-reaction")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_actor = "{{this.actor}}";
constexpr bn::string_view {{../prefix}}_{{@index}}_animation = "{{#if (or (isset this.sprite) (isset this.animation))}}{{valuedef this.animation ""}}{{else}}default{{/if}}";
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=(valuedef this.duration 1000)}}
BN_DATA_EWRAM neo::types::show_actor_reaction_event {{../prefix}}_{{@index}}(
  neo::types::event_type::SHOW_ACTOR_REACTION,
  {{../prefix}}_{{@index}}_actor,
  bn::sprite_items::{{getSpriteName @root/sprites (valuedef this.sprite "bubble_default")}},
  {{../prefix}}_{{@index}}_animation,
  {{#if (hasSpriteAnimations @root/sprites (valuedef this.sprite "bubble_default"))}}
  {{getSpriteName @root/sprites (valuedef this.sprite "bubble_default")}}_animations_count,
  {{getSpriteName @root/sprites (valuedef this.sprite "bubble_default")}}_animations,
  {{else if (or (isset this.sprite) (isset this.animation))}}
  0,
  nullptr,
  {{else}}
  bubble_default_animations_count,
  bubble_default_animations,
  {{/if}}
  &{{../prefix}}_{{@index}}_duration_value
);
{{else if (eq this.type "show-player-reaction")}}
constexpr bn::string_view {{../prefix}}_{{@index}}_animation = "{{#if (or (isset this.sprite) (isset this.animation))}}{{valuedef this.animation ""}}{{else}}default{{/if}}";
{{>valuePartial prefix=(concat ../prefix "_" @index "_duration") value=(valuedef this.duration 1000)}}
BN_DATA_EWRAM neo::types::show_player_reaction_event {{../prefix}}_{{@index}}(
  neo::types::event_type::SHOW_PLAYER_REACTION,
  bn::sprite_items::{{getSpriteName @root/sprites (valuedef this.sprite "bubble_default")}},
  {{../prefix}}_{{@index}}_animation,
  {{#if (hasSpriteAnimations @root/sprites (valuedef this.sprite "bubble_default"))}}
  {{getSpriteName @root/sprites (valuedef this.sprite "bubble_default")}}_animations_count,
  {{getSpriteName @root/sprites (valuedef this.sprite "bubble_default")}}_animations,
  {{else if (or (isset this.sprite) (isset this.animation))}}
  0,
  nullptr,
  {{else}}
  bubble_default_animations_count,
  bubble_default_animations,
  {{/if}}
  &{{../prefix}}_{{@index}}_duration_value
);
{{else}}
constexpr neo::types::event {{../prefix}}_{{@index}}(neo::types::event_type::UNKNOWN);
{{/if}}
{{else}}
constexpr neo::types::event {{../prefix}}_{{@index}}(neo::types::event_type::UNKNOWN);
{{/if}}
{{/each}}
