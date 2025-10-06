import path from 'node:path';
import fs from 'node:fs/promises';
import url from 'node:url';
import { createRequire } from 'node:module';

import {
  BrowserWindow,
  app,
  dialog,
  ipcMain,
  nativeTheme,
  net,
  protocol,
  session,
} from 'electron';
import started from 'electron-squirrel-startup';
import fse from 'fs-extra';
import slugify from 'slugify';

import type {
  AppPayload,
  GameBackground,
  GameProject,
  GameScene,
  GameSprite,
  GameVariables,
  ProjectTemplate,
} from '../types';
import { createMenus } from './menus';
import Storage from './storage';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// electron-window-corner-addon polyfill
global.require = createRequire(import.meta.url);

if (started) {
  app.quit();
}

protocol.registerSchemesAsPrivileged([
  { scheme: 'project', privileges: { bypassCSP: true } },
]);

createMenus();

const storage = new Storage();

const createSelectionWindow = async () => {
  const {
    WindowCorner,
    VibrancyMaterial,
    EffectState,
  } = await import('electron-window-corner-addon');

  const win = new BrowserWindow({
    width: 720,
    height: 480,
    frame: false,
    maximizable: false,
    resizable: false,
    minimizable: false,
    transparent: true,
    titleBarStyle: 'hidden',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  win.setWindowButtonVisibility(false);

  WindowCorner.setCornerRadius(
    win,
    26,
    VibrancyMaterial.UNDER_WINDOW_BACKGROUND,
    EffectState.ACTIVE,
  );

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    const url = new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    url.searchParams.set('theme',
      nativeTheme.shouldUseDarkColors ? 'dark' : 'light');

    win.loadURL(url.toString());
  } else {
    win.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      { query: {
        theme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
      } },
    );
  }

  win.show();

  return win;
};

const createProjectWindow = async (projectPath: string) => {
  const {
    WindowCorner,
    VibrancyMaterial,
    EffectState,
  } = await import('electron-window-corner-addon');

  const projectName = path.basename(projectPath, '.gbasproj');
  const ses = session.fromPartition(projectName);

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    transparent: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: {
      x: 24,
      y: 24,
    },
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      partition: projectName,
    },
  });

  ses.protocol.handle('project', req => {
    const filePath = req.url.replace('project://', '');

    return net.fetch(url.pathToFileURL(path
      .join(path.dirname(projectPath), filePath)).toString());
  });

  win.on('close', () => {
    ses.protocol.unhandle('project');
  });

  win.maximize();

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    const url = new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL);

    url.searchParams.set('projectPath', projectPath);
    url.searchParams.set('projectBase', path.dirname(projectPath));
    url.searchParams.set('theme',
      nativeTheme.shouldUseDarkColors ? 'dark' : 'light');

    win.loadURL(url.toString());
  } else {
    win.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      { query: {
        projectPath,
        projectBase: path.dirname(projectPath),
        theme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
      } },
    );
  }

  win.show();

  WindowCorner.setCornerRadius(
    win,
    26,
    VibrancyMaterial.WINDOW_BACKGROUND,
    EffectState.ACTIVE,
  );

  return win;
};

app.whenReady().then(() => {
  createSelectionWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createSelectionWindow();
  }
});

ipcMain.handle('get-recent-projects', async () => {
  const { recentProjects } = storage.config;

  return recentProjects || [];
});

ipcMain.handle('load-recent-project', async (event, projectPath: string) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.hide();
  win?.close();
  await new Promise(resolve => setTimeout(resolve, 100));
  createProjectWindow(projectPath);
});

ipcMain.handle('browse-projects', async event => {
  const paths = await dialog.showOpenDialog({
    properties: ['openDirectory', 'openFile'],
  });

  if (!paths.filePaths[0]) {
    return;
  }

  const selectionWin = BrowserWindow.fromWebContents(event.sender);
  selectionWin?.close();

  const stats = await fs.stat(paths.filePaths[0]);

  if (stats.isDirectory()) {
    const projectFile = await fs
      .readdir(paths.filePaths[0])
      .then(files => files.find(file => file.endsWith('.gbasproj')));

    if (projectFile) {
      createProjectWindow(path.join(paths.filePaths[0], projectFile));
    }
  } else if (stats.isFile() && paths.filePaths[0].endsWith('.gbasproj')) {
    createProjectWindow(paths.filePaths[0]);
  }
});

const getDataFiles = async (
  base: string,
  cond: (file: string) => boolean = () => true
) => {
  try {
    return (await fs
      .readdir(path.join(base, 'data')))
      .filter(file => cond(file));
  } catch {
    return [];
  }
};

const getSceneFiles = async (
  base: string,
) => {
  return getDataFiles(
    base,
    file =>
      file.startsWith('scene_') &&
      file.endsWith('.json') &&
      !file.endsWith('.map.json') &&
      file !== 'scene_default.json'
  );
};

const getMapFiles = (
  base: string,
) => {
  return getDataFiles(
    base,
    file =>
      file.startsWith('scene_') &&
      file.endsWith('.map.json')
  );
};

const getGraphicsFiles = async (
  base: string,
  cond: (file: string) => boolean = () => true
) => {
  try {
    return (await fs
      .readdir(path.join(base, 'graphics')))
      .filter(file => cond(file));
  } catch {
    return [];
  }
};

const getSoundFiles = async (
  base: string,
  cond: (file: string) => boolean = () => true
) => {
  try {
    return (await fs
      .readdir(path.join(base, 'audio')))
      .filter(file => cond(file));
  } catch {
    return [];
  }
};

ipcMain.handle('load-project', async (event, projectPath: string) => {
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
  const variableFiles = await getDataFiles(
    projectDir,
    file =>
      file.startsWith('variables_') &&
      file.endsWith('.json') &&
      file !== 'variables_default.json'
  );
  total += variableFiles.length;

  // Prepare scenes
  const sceneFiles = await getDataFiles(
    projectDir,
    file =>
      file.startsWith('scene_') &&
      file.endsWith('.json') &&
      !file.endsWith('.map.json') &&
      file !== 'scene_default.json'
  );
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

  // Load variables
  const variables: GameVariables[] = [];

  for (const file of variableFiles) {
    const registry = JSON
      .parse(await fs.readFile(path.join(projectDir, 'data', file), 'utf-8'));
    variables.push({ _file: file, values: registry });
  }

  current++;
  win?.setProgressBar(current / total);

  // Load scenes
  const scenes: GameScene[] = [];

  for (const file of sceneFiles) {
    const scene: GameScene = JSON.parse(await fs
      .readFile(path.join(projectDir, 'data', file), 'utf-8'));

    scene._file = file;

    // Eventually load map
    try {
      const mapFile = file.replace('.json', '.map.json');
      await fs.access(path.join(projectDir, 'data', mapFile));

      scene.map = JSON.parse(await fs
        .readFile(path.join(projectDir, 'data', mapFile), 'utf-8'));
      scene.map!._file = mapFile;
    } catch {}

    current++;
    win?.setProgressBar(current / total);
    scenes.push(scene);
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

  win?.setProgressBar(-1);

  return {
    project,
    scenes,
    variables,
    sprites,
    backgrounds,
    sounds,
  } as AppPayload;
});

ipcMain.handle('save-project', async (
  _,
  projectPath: string,
  data: AppPayload
) => {
  const projectDir = path.dirname(projectPath);

  // Save project config
  await fs.writeFile(projectPath,
    JSON.stringify(data.project || {}, null, 2) + '\n', 'utf-8');

  // Save variables
  for (const variableSet of data.variables || []) {
    if (variableSet._file) {
      const fileName = variableSet._file;
      delete variableSet._file;

      await fs.writeFile(path.join(projectDir, 'data', fileName),
        JSON.stringify(variableSet.values, null, 2) + '\n', 'utf-8');
    }
  }

  // Delete obsolete scenes
  const existingSceneFiles: string[] = ([] as string[])
    .concat(await getSceneFiles(projectDir))
    .concat(await getMapFiles(projectDir));

  const newSceneFiles = (data.scenes || []).flatMap(s => [
    s._file,
    s.map?._file,
  ]).filter(f => f) as string[];

  for (const file of existingSceneFiles) {
    if (!newSceneFiles.includes(file)) {
      await fs.unlink(path.join(projectDir, 'data', file));
    }
  }

  // Save scenes
  for (const scene of data.scenes || []) {
    if (scene.map?._file) {
      const fileName = scene.map._file;
      delete scene.map._file;

      await fs.writeFile(path.join(projectDir, 'data', fileName),
        JSON.stringify(scene.map, null, 2) + '\n', 'utf-8');

      delete scene.map;
    }

    if (scene._file) {
      const fileName = scene._file;
      delete scene._file;

      await fs.writeFile(path.join(projectDir, 'data', fileName),
        JSON.stringify(scene, null, 2) + '\n', 'utf-8');
    }
  }
});

ipcMain.handle('get-directory-path', async (_event, opts?: {
  prefix?: string;
  suffix?: string;
}) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  return path.join(opts?.prefix || '', result.filePaths[0], opts?.suffix || '');
});

ipcMain.handle('create-project', async (event, opts: {
  type: ProjectTemplate;
  path: string;
  name: string;
}) => {
  const projectDir = path.resolve(opts?.path || '');

  await fs.mkdir(projectDir, { recursive: true });

  // Copy commons
  await fse.copy(
    path.join(__dirname, '../../public/templates/commons'),
    projectDir
  );

  // Copy template
  await fse.copy(
    path.join(__dirname, `../../public/templates/${opts.type}`),
    projectDir
  );

  // Create .gbasproj
  const project: GameProject = {
    name: opts.name || 'My Awesome Game',
    scenes: [],
  };

  const projectPath = path.join(projectDir, `${slugify(opts.name)}.gbasproj`);
  await fs.writeFile(projectPath,
    JSON.stringify(project, null, 2) + '\n', 'utf-8');

  storage.addToRecentProjects(projectPath, project);

  // Close selection window
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.hide();
  win?.close();
  await new Promise(resolve => setTimeout(resolve, 100));

  createProjectWindow(projectPath);
});

ipcMain.handle('is-fullscreen', async event => {
  const win = BrowserWindow.fromWebContents(event.sender);

  return win?.isFullScreen() || false;
});
