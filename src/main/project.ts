import path from 'node:path';
import fsp from 'node:fs/promises';

import type {
  AppPayload,
  GameBackgroundFile,
  GameMusicFile,
  GameProject,
  GameScene,
  GameScript,
  GameSoundFile,
  GameSpriteFile,
  GameVariables,
} from '../types';
import {
  getAudioFiles,
  getGraphicFileSize,
  getGraphicsFiles,
  getSceneFiles,
  getScriptsFiles,
  getVariableFiles,
} from './files';
import { unserialize } from './serialize';
import { sanitize } from './sanitize';

export async function loadProjectData (
  projectPath: string,
  opts?: {
    onProgress?: ((current: number, total: number) => void);
  },
): Promise<Partial<AppPayload>> {
  const projectDir = path.dirname(projectPath);

  let current = 0;
  let total = 1; // project file

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
      .parse(await fsp
        .readFile(path.join(projectDir, 'content', file), 'utf-8'));
    registry._file = file;
    variables.push(registry);
  }

  current++;
  opts?.onProgress?.(current, total);

  // Load scenes
  const scenes: GameScene[] = [];

  for (const file of sceneFiles) {
    const scene: GameScene = JSON.parse(await fsp
      .readFile(path.join(projectDir, 'content', file), 'utf-8'));

    scene._file = file;

    current++;
    opts?.onProgress?.(current, total);
    scenes.push(scene);
  }

  // Load graphics
  const sprites: GameSpriteFile[] = [];
  const backgrounds: GameBackgroundFile[] = [];

  for (const file of graphicsFiles) {
    const graphic: GameSpriteFile | GameBackgroundFile = JSON.parse(await fsp
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
    opts?.onProgress?.(current, total);
  }

  // Load music
  const music: GameMusicFile[] = [];
  const sounds: GameSoundFile[] = [];

  for (const file of audioFiles) {
    const audioFile: GameSoundFile | GameMusicFile = JSON.parse(await fsp
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
    opts?.onProgress?.(current, total);
  }

  // Load scripts
  const scripts: GameScript[] = [];

  for (const file of scriptFiles) {
    const script: GameScript = JSON.parse(await fsp
      .readFile(path.join(projectDir, 'content', file), 'utf-8'));

    script._file = file;
    current++;
    opts?.onProgress?.(current, total);
    scripts.push(script);
  }

  // Load project config
  const project: GameProject = JSON.parse(
    await fsp.readFile(projectPath, 'utf-8')
  );
  current++;
  opts?.onProgress?.(current, total);

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
}
