#ifndef NEO_ACTOR_H
#define NEO_ACTOR_H

#include <bn_core.h>
#include <bn_sprite_ptr.h>

#include <neo_types.h>

namespace neo
{
  class game;

  class actor
  {
    public:
      actor(neo::game* game, const neo::types::actor* actor_definition, bool is_player = false);
      ~actor();

      inline constexpr static int PLAYER_SPEED = 2; // slow: 1, faster: 2
      inline constexpr static int SIDE_SCROLL_SPEED = 2;
      inline constexpr static int SIDE_SCROLL_JUMP = 9;
      inline constexpr static int SIDE_SCROLL_GRAVITY = 1;
      inline constexpr static int SIDE_SCROLL_MAX_FALL = 4;

      void init();
      void update();
      bn::sprite_tiles_ptr get_direction_tiles(const bn::sprite_tiles_item& item, int index);
      void set_direction(neo::types::direction direction);
      void set_position(int tile_x, int tile_y);
      void set_position(bn::fixed_point pixel_position);
      // Sets the position from tile coordinates, instantly (no animation),
      // using the overload matching how this actor tracks `position`
      // (pixels for the player, tiles for regular actors).
      void set_tile_position(int tile_x, int tile_y);
      void set_z_order(int z);
      void move_to(int tile_x, int tile_y, int speed, bn::string_view direction_priority, bn::string_view animation, bool backwards = false);
      bool collides(int tile_x, int tile_y);
      void disable();
      void enable();

      // Executes this actor's collide events (fired when the player,
      // being in a different collision group, touches this actor).
      void trigger_collide();

      neo::types::sprite_animation* get_animation(bn::string_view type);

      // Player-only
      void check_input();
      neo::types::direction opposite_direction();
      int width();
      int height();

      neo::game* game;
      const neo::types::actor* definition;
      bn::sprite_ptr sprite;
      bn::fixed_point position;
      neo::types::direction direction;
      bool moving;
      bool is_player;
      // Wave-effect x offset currently baked into sprite's rendered
      // position (see game::update_wave_effect()), so it can be removed
      // without drift regardless of how position is set.
      bn::fixed wave_offset = 0;
      int vertical_velocity = 0;
      bool grounded = false;
      bool was_moving_side_scroller = false;
      // Whether the player is currently touching this actor (different
      // collision group), so collide events fire once per touch instead
      // of on every frame of contact.
      bool player_touching = false;

    private:
      void move(neo::types::sprite_animation* anim);
      void check_input_side_scroller();
      void apply_side_scroller_gravity();
      bool side_scroller_blocked_at(int pixel_x, int pixel_y);
      // Resolves solid actors/sprites the player's footprint overlaps
      // (different collision group), firing their collide events on the
      // not-touching -> touching transition. Shared by both movement
      // models (top-down grid steps and side-scroller free movement).
      void check_collisions();
      static bn::string_view get_collision_side(
        int player_left, int player_top, int player_width, int player_height,
        int other_left, int other_top, int other_width, int other_height);
  };
}


#endif
