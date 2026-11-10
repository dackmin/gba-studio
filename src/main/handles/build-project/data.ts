import { findBackground, findSprite, getGridSize } from '../../../helpers';
import type {
  Build,
  EventValue,
  GamePlugin,
  InternalSpriteAnimation,
  SpriteAnimation,
} from '../../../types';
import { loadPlugins } from '../../plugins';
import { getBackgroundLayoutFromFile } from './assets';

const annotatePluginEvents = (node: any, plugins: GamePlugin[]) => {
  if (Array.isArray(node)) {
    node.forEach(n => annotatePluginEvents(n, plugins));

    return;
  }

  if (!node || typeof node !== 'object') {
    return;
  }

  if (typeof node.type === 'string' && node.type.startsWith('plugin:')) {
    const [, pluginId, eventId] = node.type.split(':');
    const definition = plugins
      .find(p => p.id === pluginId)?.events?.find(e => e.id === eventId);

    if (definition) {
      node._plugin = {
        handlerId: definition._handlerId,
        params: (definition.fields ?? []).map(field => ({
          key: field.key,
          value: (node.params?.[field.key] ?? field.default ?? (
            field.type === 'number' ? 0 : field.type === 'boolean' ? false : ''
          )) as EventValue,
        })),
      };
    }
  }

  Object.values(node).forEach(n => annotatePluginEvents(n, plugins));
};

const preparePlugins = async (build: Build): Promise<GamePlugin[]> => {
  const plugins = build.data?.plugins ??
    (await loadPlugins(build.projectPath, build.data?.project?.plugins))
      .filter(p => p.enabled);

  // avoid string-views and keep some ram by using a numerical id
  let handlerId = 0;

  for (const plugin of plugins) {
    for (const event of plugin.events ?? []) {
      const parts = event.handler.split('::');

      event._handlerId = handlerId++;
      event._function = parts.pop();
      event._namespace = parts.join('::');
    }
  }

  return plugins;
};

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
        loop: animation.loop ?? true,
        state: 'idle',
        direction: 'down',
      });
    }

    for (const movement of ['idle', 'moving', 'hitting', 'firing'] as const) {
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
          loop: animation.loop ?? true,
          state: movement,
          direction: direction,
        });
      }
    }

    return res;
  }, [] as InternalSpriteAnimation[]);
};

export async function preparePluginAssets (build: Build) {
  if (!build.data) {
    return build;
  }

  const plugins = (await loadPlugins(build.projectPath, build.data.project?.plugins))
    .filter(p => p.enabled);

  const assets = plugins.flatMap(p => p._assets ? [p._assets] : []);

  build.data.plugins = plugins;
  build.data.sprites = [
    ...build.data.sprites ?? [], ...assets.flatMap(a => a.sprites),
  ];
  build.data.backgrounds = [
    ...build.data.backgrounds ?? [], ...assets.flatMap(a => a.backgrounds),
  ];
  build.data.fonts = [
    ...build.data.fonts ?? [], ...assets.flatMap(a => a.fonts),
  ];
  build.data.sounds = [
    ...build.data.sounds ?? [], ...assets.flatMap(a => a.sounds),
  ];
  build.data.music = [
    ...build.data.music ?? [], ...assets.flatMap(a => a.music),
  ];

  return build;
}

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

        const gridSize = getGridSize(scene.map.gridSize);

        scene.map.width ||= Math.round(width / gridSize);
        scene.map.height ||= Math.round(height / gridSize);
      }
    }

    for (const actor of scene.actors || []) {
      const sprite = findSprite(build.data?.sprites, actor.sprite);

      if (sprite?._animations?.length) {
        actor._spriteHasAnimations = true;
      }

      actor._collisionRect = sprite?.collisionRect;
    }

    for (const sceneSprite of scene.sprites || []) {
      const sprite = findSprite(build.data?.sprites, sceneSprite.sprite);

      if (sprite?._animations?.length) {
        sceneSprite._spriteHasAnimations = true;
      }

      sceneSprite._collisionRect = sprite?.collisionRect;
    }

    if (scene.player) {
      const sprite = findSprite(build.data?.sprites, scene.player!.sprite);

      if (sprite?._animations?.length) {
        scene.player._spriteHasAnimations = true;
      }

      scene.player._collisionRect = sprite?.collisionRect;
    }
  }

  if (build.data) {
    build.data.plugins = await preparePlugins(build);
    annotatePluginEvents(
      [build.data.scenes, build.data.scripts, build.data.huds],
      build.data.plugins,
    );
  }

  return build;
}
