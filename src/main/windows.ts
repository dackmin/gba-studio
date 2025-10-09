import path from 'node:path';
import url from 'node:url';

import { net, session, BrowserWindow, nativeTheme } from 'electron';

export const createSelectionWindow = async () => {
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

export const createProjectWindow = async (projectPath: string) => {
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
