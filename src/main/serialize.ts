import type { AppPayload, GameScene, GameScript, GameVariables, SpriteAnimations } from '../types';

export const serializeAnimation = async (
  animation: SpriteAnimations
): Promise<SpriteAnimations> => {
  animation.$schema = import.meta.env.VITE_SCHEMAS_BASE + '/animation.json';

  return animation;
};

export const serializeScript = async (script: GameScript): Promise<GameScript> => {
  script.$schema = import.meta.env.VITE_SCHEMAS_BASE + '/script.json';

  return script;
};

export const serializeVariablesRegistry = async (
  registry: GameVariables
): Promise<GameVariables> => {
  registry.$schema = import.meta.env.VITE_SCHEMAS_BASE + '/variable.json';

  return registry;
};

export const serializeScene = (scene: GameScene): GameScene => {
  if (scene.map?.collisions?.length) {
    if (!Array.isArray(scene.map.collisions[0])) {
      return scene;
    }

    // @ts-expect-error - we know this is a 2D array
    scene.map.collisions = scene.map.collisions.map(l => l.join(','));
  }

  scene.$schema = import.meta.env.VITE_SCHEMAS_BASE + '/scene.json';

  return scene;
};

export const unserializeScene = (scene: GameScene): GameScene => {
  if (scene.map?.collisions?.length) {
    if (Array.isArray(scene.map.collisions[0])) {
      return scene;
    }

    // @ts-expect-error - we know this is a string array
    scene.map.collisions = scene.map.collisions.map(l => l.split(','));
  }

  return scene;
};

export const serialize = async (
  payload: Partial<AppPayload>
): Promise<Partial<AppPayload>> => {
  if (payload.scenes) {
    payload.scenes = await Promise
      .all(payload.scenes.map(scene => serializeScene(scene)));
  }

  if (payload.animations) {
    payload.animations = await Promise
      .all(payload.animations.map(animation => serializeAnimation(animation)));
  }

  if (payload.scripts) {
    payload.scripts = await Promise
      .all(payload.scripts.map(script => serializeScript(script)));
  }

  if (payload.variables) {
    payload.variables = await Promise
      .all(payload.variables.map(variable => serializeVariablesRegistry(variable)));
  }

  return payload;
};

export const unserialize = async (
  payload: Partial<AppPayload>,
): Promise<Partial<AppPayload>> => {
  if (payload.scenes) {
    payload.scenes = await Promise
      .all(payload.scenes.map(scene => unserializeScene(scene)));
  }

  return payload;
};
