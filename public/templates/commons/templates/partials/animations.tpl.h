{{#each animations}}
{{#if (hasItems this.frames)}}
{{#each this.frames}}
neo::types::sprite_animation_frame {{../../prefix}}_{{@../index}}_frame_{{@index}} = {
  {{valuedef this.index 0}},
  {{valuedef this.duration 100}},
  {{valuedef this.reversed false}}
};
{{/each}}
neo::types::sprite_animation_frame* {{../prefix}}_{{@index}}_frames[] = {
  {{#each this.frames}}
  &{{../../prefix}}_{{@../index}}_frame_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
bn::string_view {{../prefix}}_{{@index}}_id = "{{this.id}}";
bn::string_view {{../prefix}}_{{@index}}_name = "{{this.name}}";
bn::string_view {{../prefix}}_{{@index}}_type = "{{valuedef this.animationType 'fixed'}}";
neo::types::direction {{../prefix}}_{{@index}}_direction = neo::types::direction::{{uppercase (valuedef this.direction 'down')}};
neo::types::sprite_animation {{../prefix}}_{{@index}} = {
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
