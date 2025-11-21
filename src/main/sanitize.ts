import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { imageSizeFromFile } from 'image-size/fromFile';

import type {
  AppPayload,
  GameActor,
  GameProject,
  GameScene,
  GameScript,
  GameSensor,
  GameSprite,
  IfEvent,
  OnButtonPressEvent,
  SceneEvent,
} from '../types';
import { getResourcesDir } from './utils';

export const sanitizeEvent = async (event: SceneEvent): Promise<SceneEvent> => {
  if (!event.id) {
    event.id = randomUUID();
  }

  if (event.type === 'if') {
    const evt = event as IfEvent;

    for (const e of evt.then ?? []) {
      await sanitizeEvent(e);
    }

    for (const e of evt.else ?? []) {
      await sanitizeEvent(e);
    }
  }

  if (event.type === 'on-button-press') {
    const evt = event as OnButtonPressEvent;

    for (const e of evt.events ?? []) {
      await sanitizeEvent(e);
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

  for (const event of actor.events?.init ?? []) {
    await sanitizeEvent(event);
  }

  for (const event of actor.events?.interact ?? []) {
    await sanitizeEvent(event);
  }

  for (const event of actor.events?.update ?? []) {
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

  for (const event of sensor.events ?? []) {
    await sanitizeEvent(event);
  }

  return sensor;
};

export const sanitizeSprite = async (
  sprite: GameSprite
): Promise<GameSprite> => {
  if (!sprite.id) {
    sprite.id = randomUUID();
  }

  sprite.width = Number(sprite.width ?? 1);
  sprite.height = Number(sprite.height ?? 1);

  return sprite;
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
    await sanitizeSprite(sprite);
  }

  if (!scene.map) {
    scene.map = { type: 'map', width: 0, height: 0, gridSize: 16 };
  }

  // If width/height not set, try to get it from background image
  if (!scene.map.width || !scene.map.height) {
    try {
      const size = await imageSizeFromFile(
        !scene.background || scene.background === 'bg_default'
          ? path.join(getResourcesDir(), 'bg_default.bmp')
          : path.join(
            path.dirname(opts?.projectPath || ''),
            'graphics',
            `${scene.background}.bmp`
          )
      );

      if (!scene.map.width) {
        scene.map.width = Math.round(size.width / scene.map.gridSize!);
      }

      if (!scene.map.height) {
        scene.map.height = Math.round(size.height / scene.map.gridSize!);
      }
    } catch {}
  }

  if (!scene.map.gridSize) {
    scene.map.gridSize = 16;
  }

  for (const sensor of scene.map?.sensors ?? []) {
    await sanitizeSensor(sensor);
  }

  // Ensure player exists for 2d-top-down scenes & has type "player"
  if (scene.sceneType === '2d-top-down') {
    scene.player = scene.player || { type: 'player', x: 0, y: 0 };
    scene.player.type = 'player';

    if (scene.map?.collisions) {
      scene.map.width = scene.map.width || scene.map.collisions[0]?.length || 0;
      scene.map.height = scene.map.height || scene.map.collisions.length || 0;
    }
  }

  return scene;
};

export const sanitizeScript = async (
  script: GameScript
): Promise<GameScript> => {
  if (!script.id) {
    script.id = randomUUID();
  }

  for (const event of script.events ?? []) {
    await sanitizeEvent(event);
  }

  return script;
};

export const sanitizeProject = async (project: GameProject, opts?: {
  scenes: GameScene[];
}): Promise<GameProject> => {
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

  return project;
};

export interface SanitizeOptions {
  projectPath?: string;
}

export const sanitize = async (
  data: Partial<AppPayload>,
  opts?: SanitizeOptions,
): Promise<Partial<AppPayload>> => {
  if (!data.scenes) {
    data.scenes = [];
  }

  data.scenes = await Promise
    .all(data.scenes.map(scene => sanitizeScene(scene, opts)));

  if (!data.scripts) {
    data.scripts = [];
  }

  data.scripts = await Promise
    .all(data.scripts?.map(script => sanitizeScript(script)));

  if (data.project) {
    data.project = await sanitizeProject(data.project, {
      scenes: data.scenes || [],
    });
  }

  return data;
};
