#ifndef NEO_REACTION_H
#define NEO_REACTION_H

#include <bn_optional.h>
#include <bn_sprite_ptr.h>
#include <bn_sprite_tiles_item.h>

#include <neo_types.h>

namespace neo
{
  class game;

  class reaction
  {
    static constexpr int GAP = 2;

    public:
      reaction(neo::game* game);

      void show(const neo::types::show_reaction_event* event, const bn::sprite_ptr& anchor);
      void update(const bn::sprite_ptr& anchor);
      void end();
      bool active() const { return sprite.has_value(); }

    private:
      neo::game* game;
      bn::optional<bn::sprite_ptr> sprite;
      bn::optional<bn::sprite_tiles_item> tiles;
      const neo::types::sprite_animation* animation = nullptr;
      neo::types::animation_playback playback;
      int frames_left = 0;
  };
}

#endif
