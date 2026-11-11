#ifndef NEO_TEXT_H
#define NEO_TEXT_H

#include <bn_fixed_point.h>
#include <bn_sprite_ptr.h>
#include <bn_string.h>
#include <bn_vector.h>

#include <neo_types.h>

namespace neo
{
  class game;

  class text
  {
    public:
      static constexpr int MAX_LENGTH = 30;

      struct placement
      {
        bn::fixed_point origin;
        bool follows_camera;
        int bg_priority;
        int z_order;
      };

      text(
        neo::game* game,
        const neo::types::text* definition,
        const placement& placement);

      const neo::types::text* definition;

      void set_content(const neo::types::event_value* content);
      void set_blending_enabled(bool enabled);
      void update();

    private:
      void generate();

      neo::game* game;
      placement position;
      const neo::types::event_value* content;
      // What the sprites currently display
      bn::string<MAX_LENGTH> shown;
      int shown_z = 0;
      bn::vector<bn::sprite_ptr, MAX_LENGTH> sprites;
  };
}

#endif
