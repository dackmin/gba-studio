{{>ifExpressionsPartial prefix=(concat prefix "_left") expression=condition.left}}
{{>ifExpressionsPartial prefix=(concat prefix "_right") expression=condition.right}}
BN_DATA_EWRAM bn::string_view {{prefix}}_type = "condition";
BN_DATA_EWRAM bn::string_view {{prefix}}_operator = "{{condition.operator}}";
BN_DATA_EWRAM neo::types::if_condition {{prefix}}(
  {{prefix}}_type,
  {{prefix}}_operator,
  &{{prefix}}_left,
  &{{prefix}}_right
);
