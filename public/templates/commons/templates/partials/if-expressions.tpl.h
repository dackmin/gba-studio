{{#if expression}}
{{#with expression}}
{{#if (isRawValue this)}}
bn::string_view {{../prefix}}_type = "value";
bn::string_view {{../prefix}}_string_value = "{{this}}";
neo::types::if_expression_value {{../prefix}}(
  {{../prefix}}_type,
  {{../prefix}}_string_value
);
{{else if (eq this.type "variable")}}
bn::string_view {{../prefix}}_type = "variable";
bn::string_view {{../prefix}}_name = {{#with (getVariable @root/variables this.name) as | variable |}}"{{variable.name}}"{{/with}};
neo::types::if_expression_variable {{../prefix}}(
  {{../prefix}}_type,
  {{../prefix}}_name
);
{{else}}
bn::string_view {{../prefix}}_type = "{{this.type}}";
neo::types::if_expression {{../prefix}}(
  {{../prefix}}_type
);
{{/if}}
{{/with}}
{{else}}
bn::string_view {{prefix}}_type = "unknown";
neo::types::if_expression {{prefix}}(
  {{prefix}}_type
);
{{/if}}
