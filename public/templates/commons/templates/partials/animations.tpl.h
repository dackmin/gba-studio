{{#each animations}}
{{#if (hasItems this.frames)}}
{{#each this.frames}}
neo::types::sprite_animation_frame {{../prefix}}_{{@index}} = {
  {{valuedef this.frame_index 0}},
  {{valuedef this.duration 100}},
  {{valuedef this.reversed false}}
};
{{/each}}
neo::types::sprite_animation_frame* {{../prefix}}_frames[] = {
  {{#each this.frames}}
  &{{../prefix}}_{{@index}}{{#unless @last}},{{/unless}}
  {{/each}}
};
{{/if}}
neo::types::sprite_animation {{../prefix}}_{{@index}} = {
  "{{this.id}}",
  "{{this.name}}",
  {{#if (isset ../direction)}}
  neo::types::direction::{{uppercase ../direction}},
  {{else}}
  nullptr,
  {{/if}}
  {{valuedef this.moving false}},
  {{valuedef this.loop true}},
  {{#if (hasItems this.frames)}}
  {{this.frames.length}},
  &{{../prefix}}_frames
  {{else}}
  0,
  nullptr
  {{/if}}
};
{{/each}}
