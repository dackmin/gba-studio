{{#each conditions}}
// If condition {{@index}}:
{{>ifConditionPartial prefix=(concat ../prefix "_" @index) condition=this}}
{{/each}}
