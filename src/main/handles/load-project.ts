import path from 'node:path';
import fs from 'node:fs/promises';

import { type IpcMainInvokeEvent, BrowserWindow } from 'electron';

import type {
  AppPayload,
  GameProject,
  GameScene,
  GameVariables,
  GameScript,
  GameBackgroundFile,
  GameSpriteFile,
  GameSoundFile,
  GameMusicFile,
} from '../../types';
import { sanitize } from '../sanitize';
import {
  getGraphicsFiles,
  getSceneFiles,
  getScriptsFiles,
  getAudioFiles,
  getVariableFiles,
  getGraphicFileSize,
} from '../files';
import { unserialize } from '../serialize';
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

  // Prepare variables
  const variableFiles = await getVariableFiles(projectDir);
  total += variableFiles.length;

  // Prepare scenes
  const sceneFiles = await getSceneFiles(projectDir);
  total += sceneFiles.length;

  // Prepare graphics
  const graphicsFiles = await getGraphicsFiles(
    projectDir,
  );
  total += graphicsFiles.length;

  // Prepare audio files
  const audioFiles = await getAudioFiles(
    projectDir,
  );
  total += audioFiles.length;

  // Prepare scripts
  const scriptFiles = await getScriptsFiles(projectDir);
  total += scriptFiles.length;

  // Load variables
  const variables: GameVariables[] = [];

  for (const file of variableFiles) {
    const registry = JSON
      .parse(await fs
        .readFile(path.join(projectDir, 'content', file), 'utf-8'));
    registry._file = file;
    variables.push(registry);
  }

  current++;
  win?.setProgressBar(current / total);

  // Load scenes
  const scenes: GameScene[] = [];

  for (const file of sceneFiles) {
    const scene: GameScene = JSON.parse(await fs
      .readFile(path.join(projectDir, 'content', file), 'utf-8'));

    scene._file = file;

    current++;
    win?.setProgressBar(current / total);
    scenes.push(scene);
  }

  // Load graphics
  const sprites: GameSpriteFile[] = [];
  const backgrounds: GameBackgroundFile[] = [];

  for (const file of graphicsFiles) {
    const graphic: GameSpriteFile | GameBackgroundFile = JSON.parse(await fs
      .readFile(path.join(projectDir, 'content', file), 'utf-8'));

    if (['sprite'].includes(graphic.type)) {
      const { width, height } = await getGraphicFileSize(path.
        join(projectDir, graphic.path));

      graphic._realWidth = width;
      graphic._realHeight = height;

      sprites.push(graphic as GameSpriteFile);
    } else if (['background'].includes(graphic.type)) {
      backgrounds.push(graphic as GameBackgroundFile);
    }

    graphic._file = file;
    current++;
    win?.setProgressBar(current / total);
  }

  // Load music
  const music: GameMusicFile[] = [];
  const sounds: GameSoundFile[] = [];

  for (const file of audioFiles) {
    const audioFile: GameSoundFile | GameMusicFile = JSON.parse(await fs
      .readFile(path.join(projectDir, 'content', file), 'utf-8'));
    audioFile._file = file;

    switch (audioFile.type) {
      case 'sound':
        sounds.push(audioFile);
        break;
      case 'music':
        music.push(audioFile);
        break;
    }

    current++;
    win?.setProgressBar(current / total);
  }

  // Load scripts
  const scripts: GameScript[] = [];

  for (const file of scriptFiles) {
    const script: GameScript = JSON.parse(await fs
      .readFile(path.join(projectDir, 'content', file), 'utf-8'));

    script._file = file;
    current++;
    win?.setProgressBar(current / total);
    scripts.push(script);
  }

  // Load project config
  const project: GameProject = JSON.parse(
    await fs.readFile(projectPath, 'utf-8')
  );
  current++;

  // Save project to recent projects
  storage.addToRecentProjects(projectPath, project);
  win?.setProgressBar(current / total);

  // Reset progress
  win?.setProgressBar(-1);

  const payload: AppPayload = {
    project,
    scenes,
    variables,
    sprites,
    backgrounds,
    music,
    sounds,
    scripts,
  };

  return await sanitize(await unserialize(payload), { projectPath });
};
