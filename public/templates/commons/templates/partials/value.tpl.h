neo::variables::value {{prefix}}_raw_value(
  "",
  {{int (valuedef value.value value)}},
  {{bool (valuedef value.value value)}},
  {{#if (eq value.type "variable")}}
  {{#with (getVariable @root/variables value.name) as | variable |}}"{{variable.name}}"{{/with}}
  {{else}}
  "{{valuedef value.value value}}"
  {{/if}}
);
neo::types::event_value {{prefix}}_value(
  "{{valuedef value.type 'value'}}",
  &{{prefix}}_raw_value
);

