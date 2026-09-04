import type {
  AppPayload,
  GameBackgroundFile,
  GameMusicFile,
  GameScene,
  GameScript,
  GameSoundFile,
  GameSpriteFile,
  GameVariables,
} from '../types';

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

export const serializeSprite = async (
  sprite: GameSpriteFile
): Promise<GameSpriteFile> => {
  sprite.$schema = import.meta.env.VITE_SCHEMAS_BASE + '/sprite.json';

  delete sprite._realWidth;
  delete sprite._realHeight;
  delete sprite._fileName;

  return sprite;
};

export const serializeBackground = async (
  background: GameBackgroundFile
): Promise<GameBackgroundFile> => {
  background.$schema = import.meta.env.VITE_SCHEMAS_BASE + '/background.json';

  delete background._realWidth;
  delete background._realHeight;
  delete background._fileName;

  return background;
};

export const serializeMusic = async (
  music: GameMusicFile
): Promise<GameMusicFile> => {
  music.$schema = import.meta.env.VITE_SCHEMAS_BASE + '/music.json';

  delete music._fileName;

  return music;
};

export const serializeSound = async (
  sound: GameSoundFile
): Promise<GameSoundFile> => {
  sound.$schema = import.meta.env.VITE_SCHEMAS_BASE + '/sound.json';

  delete sound._fileName;

  return sound;
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

  if (payload.scripts) {
    payload.scripts = await Promise
      .all(payload.scripts.map(script => serializeScript(script)));
  }

  if (payload.variables) {
    payload.variables = await Promise
      .all(payload.variables.map(variable => serializeVariablesRegistry(variable)));
  }

  if (payload.sprites) {
    payload.sprites = await Promise
      .all(payload.sprites.map(sprite => serializeSprite(sprite)));
  }

  if (payload.backgrounds) {
    payload.backgrounds = await Promise
      .all(payload.backgrounds.map(background => serializeBackground(background)));
  }

  if (payload.sounds) {
    payload.sounds = await Promise
      .all(payload.sounds.map(sound => serializeSound(sound)));
  }

  if (payload.music) {
    payload.music = await Promise
      .all(payload.music.map(music => serializeMusic(music)));
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
