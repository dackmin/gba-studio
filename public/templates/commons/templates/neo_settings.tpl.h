#ifndef NEO_SETTINGS_H
#define NEO_SETTINGS_H

#include <bn_sprite_font.h>
#include <bn_sprite_text_generator.h>
#include <bn_sprite_palette_ptr.h>

{{#if project.settings.font}}
#include <bn_sprite_items_{{getFontName @root/fonts (valuedef project.settings.font "font_default")}}.h>
{{else}}
#include <bn_sprite_items_font_default.h>
{{/if}}
{{#if project.settings.dialogSprite}}
#include <bn_sprite_items_{{getSpriteName @root/sprites (valuedef project.settings.dialogSprite "textbox")}}.h>
{{else}}
#include <bn_sprite_items_textbox.h>
{{/if}}
{{#if project.settings.menuSprite}}
#include <bn_sprite_items_{{getSpriteName @root/sprites (valuedef project.settings.menuSprite "textbox")}}.h>
{{else}}
#include <bn_sprite_items_textbox.h>
{{/if}}

namespace neo::settings
{
  static constexpr int GLYPH_HEIGHT = {{getFontSize @root/fonts (valuedef project.settings.font "font_default")}};
  static constexpr bn::color TEXT_COLOR = { {{colorRGB (valuedef project.settings.textColor "#000")}} };

{{#if project.settings.font}}
  inline constexpr const bn::sprite_item& default_font = bn::sprite_items::{{getFontName @root/fonts (valuedef project.settings.font "font_default")}};
{{else}}
  inline constexpr const bn::sprite_item& default_font = bn::sprite_items::font_default;
{{/if}}

  static constexpr int DIALOG_PADDING_LEFT = {{valuedef project.settings.dialogPaddingLeft (valuedef project.settings.dialogPadding 8)}};
  static constexpr int DIALOG_PADDING_TOP = {{valuedef project.settings.dialogPaddingTop (valuedef project.settings.dialogPadding 8)}};
  static constexpr int DIALOG_PADDING_RIGHT = {{valuedef project.settings.dialogPaddingRight (valuedef project.settings.dialogPadding 8)}};
  static constexpr int DIALOG_PADDING_BOTTOM = {{valuedef project.settings.dialogPaddingBottom (valuedef project.settings.dialogPadding 8)}};
  static constexpr int DIALOG_MARGIN_LEFT = {{valuedef project.settings.dialogMarginLeft (valuedef project.settings.dialogMargin 4)}};
  static constexpr int DIALOG_MARGIN_TOP = {{valuedef project.settings.dialogMarginTop (valuedef project.settings.dialogMargin 4)}};
  static constexpr int DIALOG_MARGIN_RIGHT = {{valuedef project.settings.dialogMarginRight (valuedef project.settings.dialogMargin 4)}};
  static constexpr int DIALOG_MARGIN_BOTTOM = {{valuedef project.settings.dialogMarginBottom (valuedef project.settings.dialogMargin 4)}};
  static constexpr int DIALOG_PORTRAIT_GAP = {{valuedef project.settings.dialogPortraitGap 8}};

{{#if project.settings.dialogSprite}}
  inline constexpr const bn::sprite_item& default_textbox = bn::sprite_items::{{getSpriteName @root/sprites (valuedef project.settings.dialogSprite "textbox")}};
{{else}}
  inline constexpr const bn::sprite_item& default_textbox = bn::sprite_items::textbox;
{{/if}}

  static constexpr int MENU_PADDING_LEFT = {{valuedef project.settings.menuPaddingLeft (valuedef project.settings.menuPadding 8)}};
  static constexpr int MENU_PADDING_TOP = {{valuedef project.settings.menuPaddingTop (valuedef project.settings.menuPadding 8)}};
  static constexpr int MENU_PADDING_RIGHT = {{valuedef project.settings.menuPaddingRight (valuedef project.settings.menuPadding 8)}};
  static constexpr int MENU_PADDING_BOTTOM = {{valuedef project.settings.menuPaddingBottom (valuedef project.settings.menuPadding 8)}};
  static constexpr int MENU_MARGIN_LEFT = {{valuedef project.settings.menuMarginLeft (valuedef project.settings.menuMargin 4)}};
  static constexpr int MENU_MARGIN_TOP = {{valuedef project.settings.menuMarginTop (valuedef project.settings.menuMargin 4)}};
  static constexpr int MENU_MARGIN_RIGHT = {{valuedef project.settings.menuMarginRight (valuedef project.settings.menuMargin 4)}};
  static constexpr int MENU_MARGIN_BOTTOM = {{valuedef project.settings.menuMarginBottom (valuedef project.settings.menuMargin 4)}};
  static constexpr int MENU_ARROW_GAP = {{valuedef project.settings.menuArrowGap 4}};

{{#if project.settings.menuSprite}}
  inline constexpr const bn::sprite_item& default_menu_textbox = bn::sprite_items::{{getSpriteName @root/sprites (valuedef project.settings.menuSprite "textbox")}};
{{else}}
  inline constexpr const bn::sprite_item& default_menu_textbox = bn::sprite_items::textbox;
{{/if}}
}

#endif
