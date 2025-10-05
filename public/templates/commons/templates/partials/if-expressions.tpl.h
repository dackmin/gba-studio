{{#if expression}}
{{#with expression}}
{{#if (isRawValue this)}}
neo::types::if_expression_value {{../prefix}}(
  "value",
  "{{this}}"
);
{{else if (eq this.type "variable")}}
neo::types::if_expression_variable {{../prefix}}(
  "variable",
  "{{this.name}}"
);
{{else}}
neo::types::if_expression {{../prefix}}("{{this.type}}");
{{/if}}
{{/with}}
{{else}}
neo::types::if_expression {{prefix}}("unknown");
{{/if}}
