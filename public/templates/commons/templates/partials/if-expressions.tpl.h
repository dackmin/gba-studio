{{#if expression}}
{{#with expression}}
{{#if (eq this.type "condition")}}
{{>ifConditionPartial prefix=../prefix condition=this}}
{{else if (isRawValue this)}}
BN_DATA_EWRAM bn::string_view {{../prefix}}_type = "value";
BN_DATA_EWRAM bn::string_view {{../prefix}}_string_value = "{{escapeCpp this}}";
BN_DATA_EWRAM neo::types::if_expression_value {{../prefix}}(
  {{../prefix}}_type,
  {{../prefix}}_string_value
);
{{else if (eq this.type "variable")}}
BN_DATA_EWRAM bn::string_view {{../prefix}}_type = "variable";
BN_DATA_EWRAM bn::string_view {{../prefix}}_name = {{#with (getVariable @root/variables this.name) as | variable |}}"{{variable.name}}"{{/with}};
BN_DATA_EWRAM neo::types::if_expression_variable {{../prefix}}(
  {{../prefix}}_type,
  {{../prefix}}_name
);
{{else if (eq this.type "saved-game")}}
BN_DATA_EWRAM bn::string_view {{../prefix}}_type = "saved-game";
BN_DATA_EWRAM neo::types::if_expression_saved_game {{../prefix}}(
  {{../prefix}}_type
);
{{else}}
BN_DATA_EWRAM bn::string_view {{../prefix}}_type = "{{this.type}}";
BN_DATA_EWRAM neo::types::if_expression {{../prefix}}(
  {{../prefix}}_type
);
{{/if}}
{{/with}}
{{else}}
BN_DATA_EWRAM bn::string_view {{prefix}}_type = "unknown";
BN_DATA_EWRAM neo::types::if_expression {{prefix}}(
  {{prefix}}_type
);
{{/if}}
