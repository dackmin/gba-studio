#include <neo_logs.h>

#include <bn_core.h>
#include <bn_log.h>
#include <bn_display.h>

#include <neo_types.h>

#include "hud.h"
#include "game.h"
#include "text.h"

namespace neo::hud
{
  void clear (neo::game* game)
  {
    game->hud_sprites.clear();

    for (int i = 0; i < game->hud_texts.size(); ++i)
    {
      delete game->hud_texts[i];
    }

    game->hud_texts.clear();
  }

  void build (neo::game* game)
  {
    clear(game);

    if (game->active_scene->hud_data == nullptr)
    {
      return;
    }

    const neo::types::hud* hud_data = game->active_scene->hud_data;
    BN_LOG("Creating HUD: ", hud_data->name);

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

    neo::text::placement placement = {
      bn::fixed_point(0, 0), false, 0, 1000
    };

    for (int i = 0; i < hud_data->texts_count; ++i)
    {
      if (game->hud_texts.full())
      {
        BN_LOG("Too many HUD texts, ignoring: ", hud_data->texts[i]->name);
        break;
      }

      game->hud_texts.push_back(new neo::text(game, hud_data->texts[i], placement));
    }
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

    for (int i = 0; i < game->hud_texts.size(); ++i)
    {
      const neo::types::text* definition = game->hud_texts[i]->definition;

      if (text_reference == definition->_id || text_reference == definition->name)
      {
        game->hud_texts[i]->set_content(content);
        return;
      }
    }
  }

  void update (neo::game* game)
  {
    for (int i = 0; i < game->hud_texts.size(); ++i)
    {
      game->hud_texts[i]->update();
    }
  }
}
