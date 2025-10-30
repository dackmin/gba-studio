import { randomUUID } from 'node:crypto';

import type {
  GameActor,
  GameProject,
  GameScene,
  GameScript,
  GameSensor,
  IfEvent,
  OnButtonPressEvent,
  SceneEvent,
} from '../types';

export const sanitizeEvent = (event: SceneEvent): SceneEvent => {
  if (!event.id) {
    event.id = randomUUID();
  }

  if (event.type === 'if') {
    const evt = event as IfEvent;

    evt.then?.forEach(e => sanitizeEvent(e));
    evt.else?.forEach(e => sanitizeEvent(e));
  }

  if (event.type === 'on-button-press') {
    const evt = event as OnButtonPressEvent;

    evt.events?.forEach(e => sanitizeEvent(e));
  }

  return event;
};

export const sanitizeActor = (actor: GameActor): GameActor => {
  if (!actor.id) {
    actor.id = randomUUID();
  }

  actor.width = Number(actor.width ?? 1);
  actor.height = Number(actor.height ?? 1);
  actor.events?.init?.forEach(event => sanitizeEvent(event));
  actor.events?.interact?.forEach(event => sanitizeEvent(event));
  actor.events?.update?.forEach(event => sanitizeEvent(event));

  return actor;
};

export const sanitizeSensor = (sensor: GameSensor): GameSensor => {
  if (!sensor.id) {
    sensor.id = randomUUID();
  }

  sensor.width = Number(sensor.width ?? 1);
  sensor.height = Number(sensor.height ?? 1);
  sensor.events?.forEach(event => sanitizeEvent(event));

  return sensor;
};

export const sanitizeScene = (scene: GameScene): GameScene => {
  if (!scene.id) {
    scene.id = randomUUID();
  }

  scene.events?.forEach(event => sanitizeEvent(event));
  scene.actors?.forEach(actor => sanitizeActor(actor));
  scene.map?.sensors?.forEach(sensor => sanitizeSensor(sensor));

  // Ensure player exists for 2d-top-down scenes & has type "player"
  if (scene.sceneType === '2d-top-down') {
    scene.player = scene.player || { type: 'player', x: 0, y: 0 };
    scene.player.type = 'player';
  }

  return scene;
};

export const sanitizeScript = (script: GameScript): GameScript => {
  if (!script.id) {
    script.id = randomUUID();
  }

  script.events?.forEach(event => sanitizeEvent(event));

  return script;
};

export const sanitizeProject = (project: GameProject, opts?: {
  scenes: GameScene[];
}): GameProject => {
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
    opts?.scenes?.some(s => s._file === sceneData._file)
  ));

  return project;
};
