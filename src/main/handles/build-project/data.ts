import { findSprite } from '../../../helpers';
import type { Build, InternalSpriteAnimation, SpriteAnimation } from '../../../types';

export const prepareAnimations = async (
  animations: SpriteAnimation[],
): Promise<InternalSpriteAnimation[]> => {
  return animations.reduce((acc, animation) => {
    const res: InternalSpriteAnimation[] = acc || [];

    if (animation.states?.fixed) {
      res.push({
        ...animation.states.fixed,
        id: animation.id,
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

        res.push({
          ...state,
          id: animation.id,
          type: 'animation',
          name: animation.name,
          animationType: animation.animationType,
          moving: movement === 'moving',
          direction: direction,
        });
      }
    }

    return res;
  }, [] as InternalSpriteAnimation[]);
};

export async function prepareData (build: Build) {
  for (const sprite of build.data?.sprites || []) {
    if (sprite.animations) {
      sprite._animations = await prepareAnimations(sprite.animations);
    }
  }

  for (const scene of build.data?.scenes || []) {
    for (const actor of scene.actors || []) {
      const sprite = findSprite(build.data?.sprites, actor.sprite);

      if (sprite?._animations) {
        actor._spriteHasAnimations = true;
      }
    }

    if (scene.player) {
      const sprite = findSprite(build.data?.sprites, scene.player!.sprite);

      if (sprite?._animations) {
        scene.player._spriteHasAnimations = true;
      }
    }
  }

  return build;
}
