import path from 'node:path';
import fs from 'node:fs/promises';

import { type IpcMainInvokeEvent, BrowserWindow } from 'electron';

import type {
  AppPayload,
  GameProject,
  GameScene,
  GameSprite,
  GameVariables,
  GameScript,
  GameBackground,
} from '../../types';
import { sanitizeScene, sanitizeScript } from '../sanitize';
import {
  getGraphicsFiles,
  getSceneFiles,
  getScriptsFiles,
  getSoundFiles,
  getVariableFiles,
} from '../files';
import Storage from '../storage';

export default async (
  storage: Storage,
  event: IpcMainInvokeEvent,
  projectPath: string
) => {
  const projectDir = path.dirname(projectPath);

  const win = BrowserWindow.fromWebContents(event.sender);
  win?.setProgressBar(0);

  let current = 0;
  let total = 1;

  // Load project config
  const project: GameProject = JSON.parse(await fs
    .readFile(projectPath, 'utf-8'));
  current++;
  win?.setProgressBar(current / total);

  // Save project to recent projects
  storage.addToRecentProjects(projectPath, project);

  // Prepare variables
  const variableFiles = await getVariableFiles(projectDir);
  total += variableFiles.length;

  // Prepare scenes
  const sceneFiles = await getSceneFiles(projectDir);
  total += sceneFiles.length;

  // Prepare graphics
  const graphicsFiles = await getGraphicsFiles(
    projectDir,
    file => file.endsWith('.json')
  );
  total += graphicsFiles.length;

  // Prepare sounds
  const soundFiles = await getSoundFiles(
    projectDir,
    file => file.endsWith('.mod') || file.endsWith('.wav')
  );
  total += soundFiles.length;

  // Prepare scripts
  const scriptFiles = await getScriptsFiles(projectDir);
  total += scriptFiles.length;

  // Load variables
  const variables: GameVariables[] = [];

  for (const file of variableFiles) {
    const registry = JSON
      .parse(await fs.readFile(path.join(projectDir, 'data', file), 'utf-8'));
    registry._file = file;
    variables.push(registry);
  }

  current++;
  win?.setProgressBar(current / total);

  // Load scenes
  const scenes: GameScene[] = [];

  for (const file of sceneFiles) {
    const scene: GameScene = JSON.parse(await fs
      .readFile(path.join(projectDir, 'data', file), 'utf-8'));

    scene._file = file;

    current++;
    win?.setProgressBar(current / total);
    scenes.push(sanitizeScene(scene));
  }

  // Load graphics
  const sprites: GameSprite[] = [];
  const backgrounds: GameBackground[] = [];

  for (const file of graphicsFiles) {
    const graphic: GameSprite | GameBackground = JSON.parse(await fs
      .readFile(path.join(projectDir, 'graphics', file), 'utf-8'));

    if (['sprite'].includes(graphic.type)) {
      sprites.push(graphic);
    } else if (['regular_bg'].includes(graphic.type)) {
      backgrounds.push(graphic);
    }

    graphic._file = file;
    current++;
    win?.setProgressBar(current / total);
  }

  // Load sounds
  const sounds: string[] = [];

  for (const file of soundFiles) {
    sounds.push(file);
    current++;
    win?.setProgressBar(current / total);
  }

  // Load scripts
  const scripts: GameScript[] = [];

  for (const file of scriptFiles) {
    const script: GameScript = JSON.parse(await fs
      .readFile(path.join(projectDir, 'data', file), 'utf-8'));

    script._file = file;
    current++;
    win?.setProgressBar(current / total);
    scripts.push(sanitizeScript(script));
  }

  win?.setProgressBar(-1);

  return {
    project,
    scenes,
    variables,
    sprites,
    backgrounds,
    sounds,
    scripts,
  } as AppPayload;
};
