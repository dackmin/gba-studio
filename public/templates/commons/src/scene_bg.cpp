#include <neo_logs.h>

#include <bn_log.h>
#include <bn_vector.h>

#include "scene_bg.h"

namespace neo
{
  namespace
  {
    constexpr int WAVE_LOAD_MARGIN = 8;
    constexpr int RETRY_DELAY_FRAMES = 30;

    struct candidate
    {
      int index;
      int distance;
    };
  }

  scene_bg::scene_bg(bn::camera_ptr& camera_) :
    camera(camera_),
    background(),
    active(false),
    visible_(false),
    blending_enabled_(false),
    wave_enabled(false),
    wave_deltas(),
    load_cooldown(0),
    failure_logged(false)
  {
  }

  void scene_bg::set(const neo::types::background& background_, bool visible_value)
  {
    // Release everything first to prevent NO MORE VRAM errors
    reset();

    background = background_;
    active = true;
    visible_ = visible_value;
    load_cooldown = 0;
    failure_logged = false;

    update();
  }

  void scene_bg::reset()
  {
    for (slot& slot_ : slots)
    {
      release(slot_);
    }

    active = false;
  }

  bool scene_bg::has_value() const
  {
    return active;
  }

  bool scene_bg::visible() const
  {
    return visible_;
  }

  void scene_bg::set_visible(bool visible_value)
  {
    visible_ = visible_value;

    for (slot& slot_ : slots)
    {
      if (slot_.bg.has_value())
      {
        slot_.bg->set_visible(visible_);
      }
    }
  }

  void scene_bg::set_blending_enabled(bool enabled)
  {
    blending_enabled_ = enabled;

    for (slot& slot_ : slots)
    {
      if (slot_.bg.has_value())
      {
        slot_.bg->set_blending_enabled(blending_enabled_);
      }
    }
  }

  bool scene_bg::set_wave(bn::span<const bn::fixed> deltas)
  {
    wave_deltas = deltas;
    wave_enabled = true;

    bool created = false;

    for (slot& slot_ : slots)
    {
      if (slot_.bg.has_value() && !slot_.wave.has_value())
      {
        created = create_wave(slot_) || created;
      }
    }

    return created;
  }

  void scene_bg::clear_wave()
  {
    wave_enabled = false;

    for (slot& slot_ : slots)
    {
      slot_.wave.reset();
    }
  }

  bool scene_bg::has_wave() const
  {
    return wave_enabled;
  }

  void scene_bg::reload_wave()
  {
    for (slot& slot_ : slots)
    {
      if (slot_.wave.has_value())
      {
        slot_.wave->reload_deltas_ref();
      }
    }
  }

  void scene_bg::update()
  {
    if (!active)
    {
      return;
    }

    bn::vector<candidate, MAX_LOADED_TILES> needed;
    int tiles_count = background.tiles.size();

    for (int i = 0; i < tiles_count && !needed.full(); ++i)
    {
      const neo::types::background_tile& tile = background.tiles[i];

      if (!is_tile_visible(tile))
      {
        continue;
      }

      int delta_x = (tile.x + tile.width / 2 - background.width / 2) - camera.x().integer();
      int delta_y = (tile.y + tile.height / 2 - background.height / 2) - camera.y().integer();
      candidate item = { i, delta_x * delta_x + delta_y * delta_y };

      needed.push_back(item);

      for (int j = needed.size() - 1; j > 0 && needed[j].distance < needed[j - 1].distance; --j)
      {
        candidate swap = needed[j];

        needed[j] = needed[j - 1];
        needed[j - 1] = swap;
      }
    }

    for (slot& slot_ : slots)
    {
      if (slot_.tile < 0)
      {
        continue;
      }

      bool still_needed = false;

      for (const candidate& item : needed)
      {
        if (item.index == slot_.tile)
        {
          still_needed = true;
          break;
        }
      }

      if (!still_needed)
      {
        release(slot_);
        load_cooldown = 0;
      }
    }

    if (load_cooldown > 0)
    {
      --load_cooldown;
      return;
    }

    bool failed = false;

    for (const candidate& item : needed)
    {
      if (!is_tile_loaded(item.index) && !load_tile(item.index))
      {
        failed = true;
        load_cooldown = RETRY_DELAY_FRAMES;

        if (!failure_logged)
        {
          failure_logged = true;
          BN_LOG("scene_bg: not enough memory to load tile ", item.index);
        }
      }
    }

    if (!failed)
    {
      failure_logged = false;
    }
  }

  bool scene_bg::is_tile_visible(const neo::types::background_tile& tile) const
  {
    int left = tile.x - background.width / 2;
    int top = tile.y - background.height / 2;
    bn::fixed camera_x = camera.x();
    bn::fixed camera_y = camera.y();

    int margin = wave_enabled ? WAVE_LOAD_MARGIN : 0;

    return
      left < camera_x + neo::types::SCREEN_WIDTH / 2 + margin &&
      left + tile.width > camera_x - neo::types::SCREEN_WIDTH / 2 - margin &&
      top < camera_y + neo::types::SCREEN_HEIGHT / 2 + margin &&
      top + tile.height > camera_y - neo::types::SCREEN_HEIGHT / 2 - margin;
  }

  bool scene_bg::is_tile_loaded(int tile_index) const
  {
    for (const slot& slot_ : slots)
    {
      if (slot_.tile == tile_index)
      {
        return true;
      }
    }

    return false;
  }

  bool scene_bg::load_tile(int tile_index)
  {
    for (slot& slot_ : slots)
    {
      if (slot_.tile >= 0)
      {
        continue;
      }

      const neo::types::background_tile& tile = background.tiles[tile_index];

      bn::optional<bn::regular_bg_ptr> bg = tile.item.create_bg_optional(
        bn::fixed(tile.x + tile.width / 2 - background.width / 2),
        bn::fixed(tile.y + tile.height / 2 - background.height / 2)
      );

      if (!bg.has_value())
      {
        return false;
      }

      bg->set_camera(camera);
      bg->set_priority(3);
      bg->set_visible(visible_);
      bg->set_blending_enabled(blending_enabled_);

      slot_.tile = tile_index;
      slot_.bg = bn::move(bg);

      if (wave_enabled)
      {
        create_wave(slot_);
      }

      return true;
    }

    return false;
  }

  void scene_bg::release(slot& slot_)
  {
    slot_.wave.reset();
    slot_.bg.reset();
    slot_.tile = -1;
  }

  bool scene_bg::create_wave(slot& slot_)
  {
    slot_.wave = bn::regular_bg_position_hbe_ptr::create_horizontal_optional(
      *slot_.bg, wave_deltas);

    if (!slot_.wave.has_value())
    {
      BN_LOG("scene_bg: couldn't allocate the H-Blank effect");
    }

    return slot_.wave.has_value();
  }
}
