constexpr bn::string_view {{prefix}}_name = "";
{{#if (eq value.type "variable")}}
constexpr bn::string_view {{prefix}}_string_value = {{#with (getVariable @root/variables value.name) as | variable |}}"{{variable.name}}"{{else}}"{{escapeCpp value.name}}"{{/with}};
{{else if (eq value.type "actor")}}
constexpr bn::string_view {{prefix}}_string_value = "{{escapeCpp value.name}}";
{{else if (not (isInt value.value))}}
constexpr bn::string_view {{prefix}}_string_value = "{{escapeCpp (valuedef value.value value)}}";
{{/if}}
constexpr neo::variables::value {{prefix}}_raw_value(
  {{prefix}}_name,
  {{int (valuedef value.value value)}},
  {{bool (valuedef value.value value)}},
  {{#if (not (isInt value.value))}}
  {{prefix}}_string_value
  {{else}}
  bn::string_view()
  {{/if}}
);
constexpr bn::string_view {{prefix}}_type = "{{valuedef value.type 'value'}}";
constexpr neo::types::event_value {{prefix}}_value(
  {{prefix}}_type,
  &{{prefix}}_raw_value
);

