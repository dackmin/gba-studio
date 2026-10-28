#ifndef NEO_ACTOR_H
#define NEO_ACTOR_H

#include <bn_core.h>
#include <bn_sprite_ptr.h>
#include <bn_optional.h>

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
      inline constexpr static bn::fixed ADVENTURE_SPEED = 2;
      inline constexpr static int SIDE_SCROLL_SPEED = 2;
      inline constexpr static int SIDE_SCROLL_JUMP = 9;
      inline constexpr static int SIDE_SCROLL_GRAVITY = 1;
      inline constexpr static int SIDE_SCROLL_MAX_FALL = 4;
      inline constexpr static int SLOPE_MAX_STEP = SIDE_SCROLL_SPEED + 1;

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

      // Point-and-click
      void walk_to(int pixel_x, int pixel_y);
      void stop_walking();
      void trigger_hit();
      void end_attack();
      void start_firing();

      // Executes this actor's collide events (fired when the player,
      // being in a different collision group, touches this actor).
      void trigger_collide();

      // Side of the other rect hit by the first one ("up" = the first rect
      // is above the other), in the same pixel space
      static bn::string_view get_collision_side(
        int player_left, int player_top, int player_width, int player_height,
        int other_left, int other_top, int other_width, int other_height);

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
      bool hitting = false;
      int firing_frames_left = 0;
      neo::types::sprite_animation* firing_animation = nullptr;
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
      bool a_buffered = false;
      // Point-and-click
      bool walking_to_target = false;
      bn::fixed_point walk_target;
      // Adventure
      bool was_moving_adventure = false;
      int attack_frames_left = 0;
      bn::optional<bn::sprite_ptr> weapon_sprite;
      bool hit_this_swing = false;

    private:
      void move(neo::types::sprite_animation* anim);
      void check_input_side_scroller();
      void apply_side_scroller_gravity();
      void check_input_point_and_click();
      void check_input_adventure();
      bool adventure_blocked_at(int pixel_x, int pixel_y);
      bool interact_ahead();
      void start_attack();
      void update_attack();
      void update_firing();
      void end_firing(bool restore_tile = true);

      bool point_and_click_blocked_at(bn::fixed_point pixel_position);
      void update_sensors(int tile_x, int tile_y);
      bool side_scroller_blocked_at(
        int pixel_x, int pixel_y, int foot_clearance = 0, int side_inset = 0);
      int slope_surface_row(int center_x, int tile_y);
      bool slope_embedded(int pixel_x, int pixel_y);
      bool near_slope(int pixel_x, int pixel_y);
      bool adjust_to_slope(bn::fixed_point& next, int side_inset);
      bool side_view_step_x(bn::fixed step_x);
      // Resolves solid actors/sprites the player's footprint overlaps
      // (different collision group), firing their collide events on the
      // not-touching -> touching transition. Shared by both movement
      // models (top-down grid steps and side-scroller free movement).
      void check_collisions();
      bool try_interact();
  };
}


#endif
