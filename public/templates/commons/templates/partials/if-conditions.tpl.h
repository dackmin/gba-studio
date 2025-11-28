{{#each conditions}}
{{>ifExpressionsPartial prefix=(concat ../prefix "_" @index "_left") expression=this.left}}
{{>ifExpressionsPartial prefix=(concat ../prefix "_" @index "_right") expression=this.right}}
bn::string_view {{../prefix}}_{{@index}}_operator = "{{this.operator}}";
neo::types::if_condition {{../prefix}}_{{@index}}(
  {{../prefix}}_{{@index}}_operator,
  &{{../prefix}}_{{@index}}_left,
  &{{../prefix}}_{{@index}}_right
);
{{/each}}
