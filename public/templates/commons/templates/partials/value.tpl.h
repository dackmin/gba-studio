bn::string_view {{prefix}}_name = "";
{{#if (eq value.type "variable")}}
bn::string_view {{prefix}}_string_value = {{#with (getVariable @root/variables value.name) as | variable |}}"{{variable.name}}"{{/with}};
{{else}}
bn::string_view {{prefix}}_string_value = "{{valuedef value.value value}}";
{{/if}}
neo::variables::value {{prefix}}_raw_value(
  {{prefix}}_name,
  {{int (valuedef value.value value)}},
  {{bool (valuedef value.value value)}},
  {{prefix}}_string_value
);
bn::string_view {{prefix}}_type = "{{valuedef value.type 'value'}}";
neo::types::event_value {{prefix}}_value(
  {{prefix}}_type,
  &{{prefix}}_raw_value
);

