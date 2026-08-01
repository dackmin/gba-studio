{{#with state}}
{{#if (hasItems this.frames)}}
{{#each this.frames}}
neo::types::sprite_animation_frame {{../../prefix}}_frame_{{@index}} = {
  {{valuedef this.index 0}},
  {{valuedef this.duration 100}},
  {{valuedef this.reversed false}}
};
{{/each}}
neo::types::sprite_animation_frame* {{../prefix}}_frames[] = {
  {{#each this.frames}}
  &{{../../prefix}}_frame_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
bn::string_view {{../prefix}}_id = "{{this.id}}";
bn::string_view {{../prefix}}_name = "{{../name}}";
bn::string_view {{../prefix}}_type = "{{valuedef ../type 'fixed'}}";
neo::types::direction {{../prefix}}_direction = neo::types::direction::{{uppercase (valuedef ../direction 'down')}};
neo::types::sprite_animation {{../prefix}} = {
  {{../prefix}}_id,
  {{../prefix}}_name,
  {{../prefix}}_type,
  {{../prefix}}_direction,
  {{valuedef this.moving false}},
  {{valuedef this.loop true}},
  {{#if (hasItems this.frames)}}
  {{this.frames.length}},
  {{../prefix}}_frames
  {{else}}
  0,
  nullptr
  {{/if}}
};
{{/with}}
