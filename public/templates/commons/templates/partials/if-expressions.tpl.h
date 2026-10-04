{{#if expression}}
{{#with expression}}
{{#if (eq this.type "condition")}}
{{>ifConditionPartial prefix=../prefix condition=this}}
{{else if (isRawValue this)}}
constexpr bn::string_view {{../prefix}}_type = "value";
constexpr bn::string_view {{../prefix}}_string_value = "{{escapeCpp this}}";
BN_DATA_EWRAM neo::types::if_expression_value {{../prefix}}(
  {{../prefix}}_type,
  {{../prefix}}_string_value
);
{{else if (eq this.type "variable")}}
constexpr bn::string_view {{../prefix}}_type = "variable";
constexpr bn::string_view {{../prefix}}_name = {{#with (getVariable @root/variables this.name) as | variable |}}"{{variable.name}}"{{/with}};
BN_DATA_EWRAM neo::types::if_expression_variable {{../prefix}}(
  {{../prefix}}_type,
  {{../prefix}}_name
);
{{else if (eq this.type "saved-game")}}
constexpr bn::string_view {{../prefix}}_type = "saved-game";
BN_DATA_EWRAM neo::types::if_expression_saved_game {{../prefix}}(
  {{../prefix}}_type
);
{{else if (eq this.type "player-attribute")}}
constexpr bn::string_view {{../prefix}}_type = "player-attribute";
constexpr bn::string_view {{../prefix}}_attribute = "{{this.name}}";
BN_DATA_EWRAM neo::types::if_expression_player_attribute {{../prefix}}(
  {{../prefix}}_type,
  {{../prefix}}_attribute
);
{{else if (eq this.type "direction")}}
constexpr bn::string_view {{../prefix}}_type = "direction";
BN_DATA_EWRAM neo::types::if_expression_direction {{../prefix}}(
  {{../prefix}}_type,
  neo::types::direction::{{uppercase (valuedef this.name 'down')}}
);
{{else if (eq this.type "collision-side")}}
constexpr bn::string_view {{../prefix}}_type = "collision-side";
BN_DATA_EWRAM neo::types::if_expression_collision_side {{../prefix}}(
  {{../prefix}}_type
);
{{else if (eq this.type "scene")}}
constexpr bn::string_view {{../prefix}}_type = "scene";
constexpr bn::string_view {{../prefix}}_id = "{{escapeCpp this.name}}";
BN_DATA_EWRAM neo::types::if_expression_scene {{../prefix}}(
  {{../prefix}}_type,
  {{../prefix}}_id
);
{{else if (eq this.type "actor")}}
constexpr bn::string_view {{../prefix}}_type = "value";
constexpr bn::string_view {{../prefix}}_value = "{{escapeCpp this.name}}";
BN_DATA_EWRAM neo::types::if_expression_value {{../prefix}}(
  {{../prefix}}_type,
  {{../prefix}}_value
);
{{else}}
constexpr bn::string_view {{../prefix}}_type = "{{this.type}}";
BN_DATA_EWRAM neo::types::if_expression {{../prefix}}(
  {{../prefix}}_type
);
{{/if}}
{{/with}}
{{else}}
constexpr bn::string_view {{prefix}}_type = "unknown";
BN_DATA_EWRAM neo::types::if_expression {{prefix}}(
  {{prefix}}_type
);
{{/if}}
