#include <neo_logs.h>

#include <bn_core.h>
#include <bn_log.h>
#include <bn_display.h>
#include <bn_sprite_font.h>
#include <bn_sprite_text_generator.h>
#include <bn_sprite_palette_ptr.h>
#include <bn_string.h>
#include <bn_algorithm.h>

#include <bn_sprite_items_gbs_mono.h>

#include <neo_types.h>

#include "hud.h"
#include "game.h"

namespace neo::hud
{
  namespace
  {
    // FNV-1a over the resolved texts: detects changes without storing them.
    unsigned hash_text (unsigned hash, bn::string_view text)
    {
      for (int i = 0; i < text.size(); ++i)
      {
        hash ^= static_cast<unsigned char>(text[i]);
        hash *= 16777619u;
      }

      hash ^= 0xFF;
      hash *= 16777619u;

      return hash;
    }

    // Longer text is cut to the sprite budget
    void resolve_text (
      neo::game* game,
      const neo::types::event_value* content,
      bn::istring& out
    )
    {
      bn::string_view value = content->as_string(game->variables);

      out.clear();
      out.append(value, 0, bn::min(value.size(), out.available()));
    }

    unsigned hash_texts (neo::game* game)
    {
      unsigned hash = 2166136261u;

      for (int i = 0; i < game->hud_text_content.size(); ++i)
      {
        bn::string<MAX_TEXT_LENGTH> text;
        resolve_text(game, game->hud_text_content[i], text);
        hash = hash_text(hash, text);
      }

      return hash;
    }

    void generate_texts (neo::game* game)
    {
      const neo::types::hud* hud_data = game->active_scene->hud_data;

      game->hud_text_sprites.clear();

      bn::sprite_font font = bn::sprite_font(bn::sprite_items::gbs_mono);
      bn::sprite_text_generator text_generator(font);
      text_generator.set_left_alignment();
      text_generator.set_bg_priority(0);

      for (int i = 0; i < game->hud_text_content.size(); ++i)
      {
        const neo::types::hud_text* definition = hud_data->texts[i];
        bn::string<MAX_TEXT_LENGTH> text;
        resolve_text(game, game->hud_text_content[i], text);

        if (text.empty())
        {
          continue;
        }

        if (game->hud_text_sprites.available() < text.size())
        {
          BN_LOG("No room left for HUD text: ", definition->name);
          continue;
        }

        int first_sprite = game->hud_text_sprites.size();

        text_generator.set_z_order(1000 + definition->z);
        text_generator.generate_top_left(
          definition->x,
          definition->y,
          text,
          game->hud_text_sprites
        );

        bn::sprite_palette_ptr palette = bn::sprite_items::gbs_mono.palette_item().create_new_palette();

        for (int c = 1; c < 16; ++c)
        {
          palette.set_color(c, definition->color);
        }

        for (int j = first_sprite; j < game->hud_text_sprites.size(); ++j)
        {
          game->hud_text_sprites[j].set_palette(palette);
        }
      }
    }
  }

  void build (neo::game* game)
  {
    game->hud_sprites.clear();
    game->hud_text_sprites.clear();
    game->hud_text_content.clear();

    if (game->active_scene->hud_data == nullptr)
    {
      return;
    }

    const neo::types::hud* hud_data = game->active_scene->hud_data;
    BN_LOG("Creating HUD: ", hud_data->name);

    for (int i = 0; i < hud_data->texts_count; ++i)
    {
      if (game->hud_text_content.full())
      {
        BN_LOG("Too many HUD texts, ignoring: ", hud_data->texts[i]->name);
        break;
      }

      game->hud_text_content.push_back(hud_data->texts[i]->content);
    }

    for (int i = 0; i < hud_data->sprites_count && !game->hud_sprites.full(); ++i)
    {
      const neo::types::hud_sprite* definition = hud_data->sprites[i];
      bn::sprite_ptr hud_sprite = definition->sprite.create_sprite(0, 0);

      // Priority 0 draws over the scene; dialogs/menus (z < 1000) stay above.
      hud_sprite.set_bg_priority(0);
      hud_sprite.set_z_order(1000 + definition->z);
      // Butano positions sprites by their center, relative to the screen center.
      hud_sprite.set_x(definition->x - 120 + hud_sprite.dimensions().width() / 2);
      hud_sprite.set_y(definition->y - 80 + hud_sprite.dimensions().height() / 2);
      game->hud_sprites.push_back(bn::move(hud_sprite));
    }

    game->hud_text_hash = hash_texts(game);
    generate_texts(game);
  }

  void set_text (
    neo::game* game,
    bn::string_view hud_reference,
    bn::string_view text_reference,
    const neo::types::event_value* content
  )
  {
    if (game->active_scene == nullptr || game->active_scene->hud_data == nullptr)
    {
      return;
    }

    const neo::types::hud* hud_data = game->active_scene->hud_data;

    if (
      !hud_reference.empty() &&
      !(hud_reference == hud_data->_id) &&
      !(hud_reference == hud_data->name)
    )
    {
      return;
    }

    for (int i = 0; i < game->hud_text_content.size(); ++i)
    {
      const neo::types::hud_text* definition = hud_data->texts[i];

      if (text_reference == definition->_id || text_reference == definition->name)
      {
        game->hud_text_content[i] = content;
        return;
      }
    }
  }

  void update (neo::game* game)
  {
    if (
      game->active_scene == nullptr ||
      game->active_scene->hud_data == nullptr ||
      game->active_scene->hud_data->texts_count == 0
    )
    {
      return;
    }

    unsigned hash = hash_texts(game);

    if (hash != game->hud_text_hash)
    {
      game->hud_text_hash = hash;
      generate_texts(game);
    }
  }
}
