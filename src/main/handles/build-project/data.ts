import { findBackground, findSprite } from '../../../helpers';
import { getBackgroundLayoutFromFile } from './assets';
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
        hitting: false,
        direction: 'down',
      });
    }

    for (const movement of ['idle', 'moving', 'hitting'] as const) {
      for (const direction of ['up', 'down', 'left', 'right'] as const) {
        const state = animation.states[movement]?.[direction];

        if (!state || !state.frames?.length) {
          continue;
        }

        res.push({
          ...state,
          id: animation.id,
          type: 'animation',
          name: animation.name,
          animationType: animation.animationType,
          moving: movement === 'moving',
          hitting: movement === 'hitting',
          direction: direction,
        });
      }
    }

    return res;
  }, [] as InternalSpriteAnimation[]);
};

export async function prepareData (build: Build) {
  for (const background of build.data?.backgrounds || []) {
    background._layout ??= await getBackgroundLayoutFromFile(build, background);
  }

  for (const sprite of build.data?.sprites || []) {
    if (sprite.animations) {
      sprite._animations = await prepareAnimations(sprite.animations);
    }
  }

  for (const scene of build.data?.scenes || []) {
    if (scene.sceneType !== 'logos') {
      scene.map ??= { type: 'map', width: 0, height: 0, gridSize: 16 };
      scene.map.gridSize ||= 16;

      if (!scene.map.width || !scene.map.height) {
        const layout = findBackground(
          build.data?.backgrounds, scene.background)?._layout;
        const width = layout?.width ?? 256;
        const height = layout?.height ?? 256;

        scene.map.width ||= Math.round(width / scene.map.gridSize);
        scene.map.height ||= Math.round(height / scene.map.gridSize);
      }
    }

    for (const actor of scene.actors || []) {
      const sprite = findSprite(build.data?.sprites, actor.sprite);

      if (sprite?._animations?.length) {
        actor._spriteHasAnimations = true;
      }
    }

    if (scene.player) {
      const sprite = findSprite(build.data?.sprites, scene.player!.sprite);

      if (sprite?._animations?.length) {
        scene.player._spriteHasAnimations = true;
      }
    }
  }

  return build;
}
