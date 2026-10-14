#ifndef NEO_FONT_H
#define NEO_FONT_H

#include <bn_sprite_font.h>
#include <bn_sprite_text_generator.h>
#include <bn_sprite_palette_ptr.h>

{{#if fontName}}
#include <bn_sprite_items_{{fontName}}.h>
{{else}}
#include <bn_sprite_items_font_default.h>
{{/if}}

namespace neo::font
{
  constexpr int GLYPH_HEIGHT = {{glyphHeight}};
{{#if fontName}}
  inline constexpr const bn::sprite_item& default_font = bn::sprite_items::{{fontName}};
{{else}}
  inline constexpr const bn::sprite_item& default_font = bn::sprite_items::font_default;
{{/if}}
}

#endif
