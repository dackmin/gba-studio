#include <neo_logs.h>

#include <bn_log.h>
#include <bn_algorithm.h>
#include <bn_sprite_font.h>
#include <bn_sprite_palette_ptr.h>
#include <bn_sprite_text_generator.h>
#include <bn_sprites.h>
#include <bn_string.h>

#include <neo_types.h>
#include <neo_settings.h>

#include "text.h"
#include "game.h"

namespace neo
{
  namespace
  {
    void resolve(
      neo::game* game,
      const neo::types::event_value* content,
      bn::istring& out
    )
    {
      bn::string_view value = content->as_string(game->variables);

      out.clear();
      out.append(value, 0, bn::min(value.size(), out.available()));
    }
  }

  text::text(
    neo::game* game_,
    const neo::types::text* definition_,
    const placement& placement_
  ): definition(definition_),
     game(game_),
     position(placement_),
     content(definition_->content)
  {
    update();
  }

  void text::set_content(const neo::types::event_value* content_)
  {
    content = content_;
  }

  void text::set_blending_enabled(bool enabled)
  {
    for (int i = 0; i < sprites.size(); ++i)
    {
      sprites[i].set_blending_enabled(enabled);
    }
  }

  void text::update()
  {
    bn::string<MAX_LENGTH> value;
    resolve(game, content, value);
    int z = position.z_order + definition->z->as_int(game->variables);

    if (value != shown || z != shown_z)
    {
      shown = value;
      shown_z = z;
      generate();
    }
  }

  void text::generate()
  {
    sprites.clear();

    if (shown.empty())
    {
      return;
    }

    if (bn::sprites::available_items_count() < shown.size())
    {
      BN_LOG("No room left for text: ", definition->name);
      return;
    }

    const bn::sprite_item& font_item = definition->font != nullptr
      ? *definition->font
      : neo::settings::default_font;
    bn::sprite_text_generator text_generator{bn::sprite_font(font_item)};
    text_generator.set_left_alignment();
    text_generator.set_bg_priority(position.bg_priority);
    text_generator.set_z_order(shown_z);

    if (position.follows_camera)
    {
      text_generator.set_camera(game->camera);
    }

    text_generator.generate_top_left(
      position.origin.x() + definition->x,
      position.origin.y() + definition->y,
      shown,
      sprites
    );

    bn::sprite_palette_ptr palette = font_item.palette_item().create_new_palette();

    for (int c = 1; c < 16; ++c)
    {
      palette.set_color(c, definition->color);
    }

    for (int i = 0; i < sprites.size(); ++i)
    {
      sprites[i].set_palette(palette);
    }

    set_blending_enabled(game->blending_enabled);
  }
}
