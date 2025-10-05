{{#each conditions}}
{{>ifExpressionsPartial prefix=(concat ../prefix "_" @index "_left") expression=this.left}}
{{>ifExpressionsPartial prefix=(concat ../prefix "_" @index "_right") expression=this.right}}
neo::types::if_condition {{../prefix}}_{{@index}}(
  "{{this.operator}}",
  &{{../prefix}}_{{@index}}_left,
  &{{../prefix}}_{{@index}}_right
);
{{/each}}
