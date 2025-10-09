{{#each events}}
{{#if (eq this.type "wait")}}
neo::types::wait_event {{../prefix}}_{{@index}}("wait", {{this.duration}});
{{else if (eq this.type "fade-in")}}
neo::types::fade_event {{../prefix}}_{{@index}}("fade-in", {{this.duration}});
{{else if (eq this.type "fade-out")}}
neo::types::fade_event {{../prefix}}_{{@index}}("fade-out", {{this.duration}});
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
neo::types::button_event {{../prefix}}_{{@index}}(
  "{{this.type}}",
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
int {{../prefix}}_{{@index}}_start_pos[2] = { {{valuedef this.start.x -1}}, {{valuedef this.start.y -1}} };
neo::types::scene_event {{../prefix}}_{{@index}}(
  "go-to-scene",
  "{{this.target}}",
  {{../prefix}}_{{@index}}_start_pos,
  neo::types::direction::{{uppercase (valuedef this.start.direction 'down')}}
);
{{else if (eq this.type "show-dialog")}}
neo::types::dialog_event {{../prefix}}_{{@index}}(
  "show-dialog",
  "{{preserveLineBreaks this.text}}"
);
{{else if (eq this.type "set-variable")}}
neo::types::set_variable_event {{../prefix}}_{{@index}}(
  "set-variable",
  "{{this.name}}",
  "{{this.value}}"
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
neo::types::if_event {{../prefix}}_{{@index}}(
  "if",
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
neo::types::disable_actor_event {{../prefix}}_{{@index}}("disable-actor", "{{this.actor}}");
{{else if (eq this.type "enable-actor")}}
neo::types::enable_actor_event {{../prefix}}_{{@index}}("enable-actor", "{{this.actor}}");
{{else if (eq this.type "play-music")}}
neo::types::play_music_event {{../prefix}}_{{@index}}("play-music", "{{this.name}}", {{this.volume}}, {{this.loop}});
{{else if (eq this.type "stop-music")}}
neo::types::stop_music_event {{../prefix}}_{{@index}}("stop-music");
{{else if (eq this.type "play-sound")}}
neo::types::play_sound_event {{../prefix}}_{{@index}}("play-sound", "{{this.name}}", {{this.volume}}, {{this.speed}}, {{this.panning}}, {{this.priority}});
{{else if (eq this.type "execute-script")}}
neo::types::execute_script_event {{../prefix}}_{{@index}}("execute-script", "{{this.script}}");
{{else}}
neo::types::event {{../prefix}}_{{@index}}("{{this.type}}");
{{/if}}
{{/each}}
