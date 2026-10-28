import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { imageSizeFromFile } from 'image-size/fromFile';

import type {
  AppPayload,
  CharacterDirection,
  GameActor,
  GameBackgroundFile,
  GameFontFile,
  GameHud,
  GameHudSprite,
  GameHudText,
  GameMusicFile,
  GameProject,
  GameScene,
  GameScript,
  GameScriptParameter,
  GameSensor,
  GameSoundFile,
  GameSprite,
  GameSpriteFile,
  GameVariable,
  GameVariables,
  IfEvent,
  OnButtonPressEvent,
  OnVariableChangeEvent,
  ParallelEventsEvent,
  SceneEvent,
  ShowMenuEvent,
  SpriteAnimation,
  SpriteAnimationFrame,
  SpriteAnimations,
  SpriteAnimationState,
} from '../types';
import {
  findBackground,
  getMapSize,
  getStaticGridSize,
  resizeCollisions,
} from '../helpers';
import { getResourcesDir } from './utils';

export const sanitizeEvent = async (event: SceneEvent): Promise<SceneEvent> => {
  if (!event.id) {
    event.id = randomUUID();
  }

  if (event.type === 'if') {
    const evt = event as IfEvent;

    evt.then = evt.then ?? [];
    evt.else = evt.else ?? [];

    for (const e of evt.then ?? []) {
      await sanitizeEvent(e);
    }

    for (const e of evt.else ?? []) {
      await sanitizeEvent(e);
    }
  }

  if (event.type === 'parallel-events') {
    const evt = event as ParallelEventsEvent;
    evt.events = evt.events ?? [];

    for (const e of evt.events) {
      await sanitizeEvent(e);
    }
  }

  if (event.type === 'on-button-press') {
    const evt = event as OnButtonPressEvent;

    evt.events = evt.events ?? [];

    for (const e of evt.events ?? []) {
      await sanitizeEvent(e);
    }
  }

  if (event.type === 'on-variable-change') {
    const evt = event as OnVariableChangeEvent;

    evt.events = evt.events ?? [];

    for (const e of evt.events) {
      await sanitizeEvent(e);
    }
  }

  if (event.type === 'show-menu') {
    const evt = event as ShowMenuEvent;

    evt.choices = evt.choices ?? [];

    for (const choice of evt.choices) {
      choice.type = 'menu-choice';
      choice.id = choice.id ?? randomUUID();

      for (const e of choice.events ?? []) {
        await sanitizeEvent(e);
      }
    }
  }

  return event;
};

export const sanitizeActor = async (actor: GameActor): Promise<GameActor> => {
  if (!actor.id) {
    actor.id = randomUUID();
  }

  actor.width = Number(actor.width ?? 1);
  actor.height = Number(actor.height ?? 1);
  actor.collisionGroup = Math.min(4, Math.max(0, Number(actor.collisionGroup ?? 0)));

  for (const event of actor.events?.init ?? []) {
    await sanitizeEvent(event);
  }

  for (const event of actor.events?.interact ?? []) {
    await sanitizeEvent(event);
  }

  for (const event of actor.events?.update ?? []) {
    await sanitizeEvent(event);
  }

  for (const event of actor.events?.collide ?? []) {
    await sanitizeEvent(event);
  }

  for (const event of actor.events?.hit ?? []) {
    await sanitizeEvent(event);
  }

  return actor;
};

export const sanitizeSensor = async (
  sensor: GameSensor
): Promise<GameSensor> => {
  if (!sensor.id) {
    sensor.id = randomUUID();
  }

  sensor.width = Number(sensor.width ?? 1);
  sensor.height = Number(sensor.height ?? 1);

  for (const event of sensor.events?.enter ?? []) {
    await sanitizeEvent(event);
  }

  for (const event of sensor.events?.interact ?? []) {
    await sanitizeEvent(event);
  }

  for (const event of sensor.events?.leave ?? []) {
    await sanitizeEvent(event);
  }

  return sensor;
};

export const sanitizeSceneSprite = async (
  sprite: GameSprite
): Promise<GameSprite> => {
  if (!sprite.id) {
    sprite.id = randomUUID();
  }

  sprite.width = Number(sprite.width ?? 1);
  sprite.height = Number(sprite.height ?? 1);
  sprite.collisionGroup = Math.min(4, Math.max(0, Number(sprite.collisionGroup ?? 0)));

  for (const event of sprite.events?.init ?? []) {
    await sanitizeEvent(event);
  }

  for (const event of sprite.events?.interact ?? []) {
    await sanitizeEvent(event);
  }

  for (const event of sprite.events?.collide ?? []) {
    await sanitizeEvent(event);
  }

  return sprite;
};

export const sanitizeHudSprite = async (
  sprite: GameHudSprite
): Promise<GameHudSprite> => {
  if (!sprite.id) {
    sprite.id = randomUUID();
  }

  sprite.type = 'hud-sprite';
  sprite.x = Math.round(Number(sprite.x ?? 0));
  sprite.y = Math.round(Number(sprite.y ?? 0));
  sprite.z = Math.min(99, Math.max(0, Math.round(Number(sprite.z ?? 0))));

  return sprite;
};

export const sanitizeHudText = async (
  text: GameHudText
): Promise<GameHudText> => {
  if (!text.id) {
    text.id = randomUUID();
  }

  text.type = 'hud-text';

  if (typeof text.text === 'object' && text.text !== null) {
    if (text.text.type !== 'variable') {
      text.text = '';
    }
  } else {
    text.text = String(text.text ?? '').replace(/[\r\n]+/g, ' ').slice(0, 30);
  }

  text.x = Math.round(Number(text.x ?? 0));
  text.y = Math.round(Number(text.y ?? 0));
  text.z = Math.min(99, Math.max(0, Math.round(Number(text.z ?? 0))));

  return text;
};

export const sanitizeHud = async (hud: GameHud): Promise<GameHud> => {
  if (!hud.id) {
    hud.id = randomUUID();
  }

  hud.type = 'hud';
  hud.sprites = await Promise
    .all((hud.sprites ?? []).map(sprite => sanitizeHudSprite(sprite)));
  hud.texts = await Promise
    .all((hud.texts ?? []).map(text => sanitizeHudText(text)));

  for (const event of hud.events?.init ?? []) {
    await sanitizeEvent(event);
  }

  for (const event of hud.events?.update ?? []) {
    await sanitizeEvent(event);
  }

  return hud;
};

export const sanitizeScene = async (
  scene: GameScene,
  opts?: SanitizeOptions
): Promise<GameScene> => {
  if (!scene.id) {
    scene.id = randomUUID();
  }

  for (const event of scene.events ?? []) {
    await sanitizeEvent(event);
  }

  for (const actor of scene.actors ?? []) {
    await sanitizeActor(actor);
  }

  for (const sprite of scene.sprites ?? []) {
    await sanitizeSceneSprite(sprite);
  }

  if (!scene.map) {
    scene.map = { type: 'map', width: 0, height: 0, gridSize: 16 };
  }

  if (!scene.map.gridSize) {
    scene.map.gridSize = 16;
  }

  const gridSize = getStaticGridSize(scene.map.gridSize);

  try {
    if (!gridSize) {
      throw new Error('Dynamic grid size');
    }

    const background = findBackground(opts?.backgrounds, scene.background);
    const size = await imageSizeFromFile(
      !scene.background || scene.background === 'bg_default'
        ? path.join(getResourcesDir(), 'bg_default.bmp')
        : background?.path
          ? path.join(path.dirname(opts?.projectPath || ''), background.path)
          : path.join(
            path.dirname(opts?.projectPath || ''),
            'graphics',
            `${scene.background}.bmp`
          )
    );

    const { width, height } = getMapSize(size.width, size.height, gridSize);

    if (scene.map.collisions?.length) {
      scene.map.collisions = resizeCollisions(
        scene.map.collisions, width, height);
    }

    scene.map.width = width;
    scene.map.height = height;
  } catch {}

  for (const sensor of scene.map?.sensors ?? []) {
    await sanitizeSensor(sensor);
  }

  // Ensure player exists for map-based scenes & has type "player"
  if (['2d-top-down', 'side-scroller', 'adventure'].includes(scene.sceneType)) {
    scene.player = scene.player || { type: 'player', x: 0, y: 0 };
  }

  if (scene.player) {
    scene.player.type = 'player';
  }

  if (scene.sceneType !== 'logos' && scene.map?.collisions) {
    scene.map.width = scene.map.width || scene.map.collisions[0]?.length || 0;
    scene.map.height = scene.map.height || scene.map.collisions.length || 0;
  }

  return scene;
};

export const sanitizeScriptParameter = async (
  parameter: GameScriptParameter
): Promise<GameScriptParameter> => {
  if (!parameter.id) {
    parameter.id = randomUUID();
  }

  if (!parameter.name) {
    parameter.name = 'parameter';
  }

  if (!['variable', 'actor'].includes(parameter.type)) {
    parameter.type = 'value';
  }

  return parameter;
};

export const sanitizeScript = async (
  script: GameScript
): Promise<GameScript> => {
  if (!script.id) {
    script.id = randomUUID();
  }

  for (const parameter of script.parameters ?? []) {
    await sanitizeScriptParameter(parameter);
  }

  for (const event of script.events ?? []) {
    await sanitizeEvent(event);
  }

  return script;
};

export const sanitizeVariable = async (
  variable: GameVariable
): Promise<GameVariable> => {
  if (!variable.id) {
    variable.id = randomUUID();
  }

  if (!variable.type) {
    variable.type = 'variable';
  }

  return variable;
};

export const sanitizeVariablesRegistry = async (
  variables: GameVariables
): Promise<GameVariables> => {
  if (!variables.id) {
    variables.id = randomUUID();
  }

  if (!variables.values) {
    variables.values = [];
  }

  variables.values = await Promise
    .all(variables.values.map(variable => sanitizeVariable(variable)));

  return variables;
};

export const sanitizeAnimationFrame = async (
  frame: SpriteAnimationFrame,
): Promise<SpriteAnimationFrame> => {
  if (!frame.id) {
    frame.id = randomUUID();
  }

  frame.index = Number(frame.index ?? 0);
  frame.duration = Number(frame.duration ?? 100);

  return frame;
};

export const sanitizeAnimationState = async (
  state: SpriteAnimationState,
): Promise<SpriteAnimationState> => {
  if (!state.id) {
    state.id = randomUUID();
  }

  if (!state.type) {
    state.type = 'state';
  }

  if (!state.frames) {
    state.frames = [];
  }

  for (const frame of state.frames) {
    await sanitizeAnimationFrame(frame);
  }

  return state;
};

export const sanitizeAnimation = async (
  animation: SpriteAnimation
): Promise<SpriteAnimation> => {
  if (!animation.id) {
    animation.id = randomUUID();
  }

  if (!animation.states) {
    animation.states = {};
  }

  if (!animation.type) {
    animation.type = 'animation';
  }

  if (!animation.animationType) {
    animation.animationType = 'fixed';
  }

  if (!animation.states.fixed) {
    animation.states.fixed = {
      id: randomUUID(),
      type: 'state',
      frames: [],
    };
  }

  await sanitizeAnimationState(animation.states.fixed);

  if (animation.animationType !== 'fixed') {
    for (const stateName of ['idle', 'moving', 'hitting', 'firing'] as (
      keyof Omit<typeof animation.states, 'fixed'>
    )[]) {
      if (!animation.states[stateName]) {
        animation.states[stateName] = {};
      }

      for (const direction of ['up', 'down', 'left', 'right'] as CharacterDirection[]) {
        if (!animation.states[stateName][direction]) {
          animation.states[stateName][direction] = {
            id: randomUUID(),
            type: 'state',
            frames: [],
          };
        }

        await sanitizeAnimationState(animation.states[stateName][direction]);
      }
    }
  }

  return animation;
};

export const sanitizeAnimationsRegistry = async (
  animations: SpriteAnimations
): Promise<SpriteAnimations> => {
  if (!animations.id) {
    animations.id = randomUUID();
  }

  if (!animations.animations) {
    animations.animations = [];
  }

  animations.animations = await Promise
    .all(animations.animations.map(animation => sanitizeAnimation(animation)));

  return animations;
};

export const sanitizeSprite = async (
  sprite: GameSpriteFile
): Promise<GameSpriteFile> => {
  if (!sprite.id) {
    sprite.id = randomUUID();
  }

  if (!sprite.format) {
    sprite.format = path.extname(sprite.path).slice(1);
  }

  sprite.width = Number(sprite.width ?? 1);
  sprite.height = Number(sprite.height ?? 1);
  sprite.animations = await Promise
    .all((sprite.animations || []).map(animation => sanitizeAnimation(animation)));

  return sprite;
};

export const sanitizeBackground = async (
  background: GameBackgroundFile
): Promise<GameBackgroundFile> => {
  if (!background.id) {
    background.id = randomUUID();
  }

  if (!background.format) {
    background.format = path.extname(background.path).slice(1);
  }

  return background;
};

export const sanitizeFont = async (
  font: GameFontFile
): Promise<GameFontFile> => {
  if (!font.id) {
    font.id = randomUUID();
  }

  if (!font.format) {
    font.format = path.extname(font.path).slice(1);
  }

  font.width = Number(font.width ?? 8);
  font.height = Number(font.height ?? 8);

  return font;
};

export const sanitizeMusic = async (
  music: GameMusicFile
): Promise<GameMusicFile> => {
  if (!music.id) {
    music.id = randomUUID();
  }

  return music;
};

export const sanitizeSound = async (
  sound: GameSoundFile
): Promise<GameSoundFile> => {
  if (!sound.id) {
    sound.id = randomUUID();
  }

  return sound;
};

export const sanitizeProject = async (project: GameProject, opts?: {
  scenes: GameScene[];
  huds?: GameHud[];
}): Promise<GameProject> => {
  if (!project.id) {
    project.id = randomUUID();
  }

  if (!project.scenes) {
    project.scenes = [];
  }

  // Add missing ids
  project.scenes = project.scenes.map(sceneData => {
    if (!sceneData.id) {
      sceneData.id = opts?.scenes?.find(s => s._file === sceneData._file)?.id;
    }

    return sceneData;
  });

  // Remove deleted scenes
  project.scenes = project.scenes.filter(sceneData => (
    opts?.scenes?.some(s => (
      s._file === sceneData._file || s.id === sceneData.id
    ))
  ));

  project.huds = (project.huds ?? []).map(hudData => {
    if (!hudData.id) {
      hudData.id = opts?.huds?.find(h => h._file === hudData._file)?.id;
    }

    return hudData;
  }).filter(hudData => (
    opts?.huds?.some(h => (
      h._file === hudData._file || h.id === hudData.id
    ))
  ));

  return project;
};

export interface SanitizeOptions {
  projectPath?: string;
  backgrounds?: GameBackgroundFile[];
}

export const sanitize = async (
  data: Partial<AppPayload>,
  opts?: SanitizeOptions,
): Promise<Partial<AppPayload>> => {
  // Scenes
  data.scenes = await Promise
    .all((data.scenes || []).map(scene => sanitizeScene(scene, {
      ...opts,
      backgrounds: opts?.backgrounds ?? data.backgrounds,
    })));

  // Huds
  data.huds = await Promise
    .all((data.huds || []).map(hud => sanitizeHud(hud)));

  // Scenes can't reference a deleted hud
  for (const scene of data.scenes) {
    if (scene.hud && !data.huds.some(h => h.id === scene.hud)) {
      delete scene.hud;
    }
  }

  // Scripts
  data.scripts = await Promise
    .all((data.scripts || []).map(script => sanitizeScript(script)));

  // Variables
  data.variables = await Promise
    .all((data.variables || []).map(registry => sanitizeVariablesRegistry(registry)));

  // Sprites
  data.sprites = await Promise
    .all((data.sprites || []).map(sprite => sanitizeSprite(sprite)));

  // Backgrounds
  data.backgrounds = await Promise
    .all((data.backgrounds || []).map(background => sanitizeBackground(background)));

  // Fonts
  data.fonts = await Promise
    .all((data.fonts || []).map(font => sanitizeFont(font)));

  // Sounds
  data.sounds = await Promise
    .all((data.sounds || []).map(sound => sanitizeSound(sound)));

  // Music
  data.music = await Promise
    .all((data.music || []).map(music => sanitizeMusic(music)));

  if (data.project) {
    data.project = await sanitizeProject(data.project, {
      scenes: data.scenes || [],
      huds: data.huds || [],
    });
  }

  return data;
};
