#ifndef NEO_SCENE_BG_H
#define NEO_SCENE_BG_H

#include <bn_camera_ptr.h>
#include <bn_fixed.h>
#include <bn_optional.h>
#include <bn_regular_bg_ptr.h>
#include <bn_regular_bg_position_hbe_ptr.h>
#include <bn_span.h>

#include <neo_types.h>

namespace neo
{
  class scene_bg
  {
    public:
      static constexpr int MAX_LOADED_TILES = 4;

      scene_bg(bn::camera_ptr& camera_);

      void set(const neo::types::background& background_, bool visible_);
      void reset();
      void update();

      bool has_value() const;
      bool visible() const;
      void set_visible(bool visible_);
      void set_blending_enabled(bool enabled_);

      bool set_wave(bn::span<const bn::fixed> deltas_);
      void clear_wave();
      bool has_wave() const;
      void reload_wave();

    private:
      struct slot
      {
        int tile = -1;
        bn::optional<bn::regular_bg_ptr> bg;
        bn::optional<bn::regular_bg_position_hbe_ptr> wave;
      };

      bn::camera_ptr& camera;
      neo::types::background background;
      bool active;
      bool visible_;
      bool blending_enabled_;
      bool wave_enabled;
      bn::span<const bn::fixed> wave_deltas;
      int load_cooldown;
      bool failure_logged;
      slot slots[MAX_LOADED_TILES];

      bool is_tile_visible(const neo::types::background_tile& tile) const;
      bool is_tile_loaded(int tile_index) const;
      bool load_tile(int tile_index);
      void release(slot& slot_);
      bool create_wave(slot& slot_);
  };
}

#endif
