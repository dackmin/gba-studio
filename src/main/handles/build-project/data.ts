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
      const sprite = build.data?.sprites
        ?.find(a => a._file === actor.sprite + '.json');

      if (sprite?.animations) {
        actor._animations = await prepareAnimations(sprite.animations);
      }
    }

    if (scene.player) {
      const sprite = build.data?.sprites
        ?.find(a => a._file === scene.player!.sprite + '.json');

      if (sprite?.animations) {
        scene.player._animations = await prepareAnimations(sprite.animations);
      }
    }
  }

  return build;
}
