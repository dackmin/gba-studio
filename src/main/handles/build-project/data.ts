import type { Build, InternalActorAnimation, SpriteAnimation } from '../../../types';

export const prepareAnimations = async (
  animations: SpriteAnimation[],
): Promise<InternalActorAnimation[]> => {
  return animations.reduce((acc, animation) => {
    const res: InternalActorAnimation[] = acc || [];

    if (animation.states?.fixed) {
      res.push({
        ...animation.states.fixed,
        type: 'animation',
        name: animation.name,
        animationType: animation.animationType,
        moving: false,
        direction: 'down',
      });
    }

    for (const movement of ['idle', 'moving'] as const) {
      for (const direction of ['up', 'down', 'left', 'right'] as const) {
        const state = animation.states[movement]?.[direction];

        if (!state) {
          continue;
        }

        return res.concat({
          ...state,
          type: 'animation',
          name: animation.name,
          animationType: animation.animationType,
          moving: movement === 'moving',
          direction: direction,
        });
      }
    }

    return res;
  }, [] as InternalActorAnimation[]);
};

export async function prepareData (build: Build) {
  for (const scene of build.data?.scenes || []) {
    for (const actor of scene.actors || []) {
      const animations = build.data?.animations
        ?.find(a => a._sprite_file === actor.sprite + '.json');

      if (animations) {
        actor._animations = await prepareAnimations(animations.animations);
      }
    }

    if (scene.player) {
      const animations = build.data?.animations
        ?.find(a => a._sprite_file === scene.player!.sprite + '.json');

      if (animations) {
        scene.player._animations = await prepareAnimations(animations.animations);
      }
    }
  }

  return build;
}
