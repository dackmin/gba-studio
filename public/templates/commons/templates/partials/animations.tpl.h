{{#each animations}}
{{#if (hasItems this.frames)}}
{{#each this.frames}}
{{>valuePartial prefix=(concat ../../prefix "_" @../index "_frame_" @index "_duration") value=(valuedef this.duration 100)}}
BN_DATA_EWRAM neo::types::sprite_animation_frame {{../../prefix}}_{{@../index}}_frame_{{@index}} = {
  {{valuedef this.index 0}},
  &{{../../prefix}}_{{@../index}}_frame_{{@index}}_duration_value,
  {{valuedef this.reversed false}}
};
{{/each}}
BN_DATA_EWRAM neo::types::sprite_animation_frame* {{../prefix}}_{{@index}}_frames[] = {
  {{#each this.frames}}
  &{{../../prefix}}_{{@../index}}_frame_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
BN_DATA_EWRAM bn::string_view {{../prefix}}_{{@index}}_id = "{{this.id}}";
BN_DATA_EWRAM bn::string_view {{../prefix}}_{{@index}}_name = "{{this.name}}";
BN_DATA_EWRAM bn::string_view {{../prefix}}_{{@index}}_type = "{{valuedef this.animationType 'fixed'}}";
BN_DATA_EWRAM neo::types::direction {{../prefix}}_{{@index}}_direction = neo::types::direction::{{uppercase (valuedef this.direction 'down')}};
BN_DATA_EWRAM neo::types::sprite_animation {{../prefix}}_{{@index}} = {
  {{../prefix}}_{{@index}}_id,
  {{../prefix}}_{{@index}}_name,
  {{../prefix}}_{{@index}}_type,
  {{../prefix}}_{{@index}}_direction,
  {{valuedef this.moving false}},
  {{valuedef this.loop true}},
  {{#if (hasItems this.frames)}}
  {{this.frames.length}},
  {{../prefix}}_{{@index}}_frames
  {{else}}
  0,
  nullptr
  {{/if}}
};
{{/each}}
