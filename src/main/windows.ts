import path from 'node:path';
import url from 'node:url';

import { net, session, BrowserWindow, nativeTheme, app } from 'electron';

import { getResourcesDir } from './utils';
import { createAudioFileWatcher, createGraphicsFileWatcher } from './events';

const opened: Map<string, BrowserWindow> = new Map();

export const createSelectionWindow = async () => {
  // const {
  //   WindowCorner,
  //   VibrancyMaterial,
  //   EffectState,
  // } = await import('@neoframe/electron-window-corner-addon');

  const win = new BrowserWindow({
    width: 720,
    height: 480,
    maximizable: false,
    resizable: false,
    ...process.platform === 'darwin' && {
      titleBarStyle: 'hidden',
      frame: false,
      transparent: true,
      minimizable: false,
      vibrancy: 'under-window',
    },
    ...process.platform === 'win32' && {
      autoHideMenuBar: true,
      backgroundColor: nativeTheme.shouldUseDarkColors
        ? '#1A1A1A'
        : '#FAFAFA',
    },
    show: false,
    webPreferences: {
      preload: path.join(app.getAppPath(), './.vite/build/preload.js'),
      contextIsolation: true,
      devTools: false,
      ...MAIN_WINDOW_VITE_DEV_SERVER_URL && {
        devTools: true,
      },
    },
  });

  if (process.platform === 'darwin') {
    win.setWindowButtonVisibility(false);
  }

  // WindowCorner.setCornerRadius(
  //   win,
  //   26,
  //   VibrancyMaterial.UNDER_WINDOW_BACKGROUND,
  //   EffectState.ACTIVE,
  // );

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    const url = new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    url.searchParams.set('theme',
      nativeTheme.shouldUseDarkColors ? 'dark' : 'light');

    win.loadURL(url.toString());
  } else {
    win.loadFile(
      path.join(app.getAppPath(),
        `./.vite/renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      { query: {
        theme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
      } },
    );
  }

  win.show();

  return win;
};

export const createProjectWindow = async (projectPath: string) => {
  // const {
  //   WindowCorner,
  //   VibrancyMaterial,
  //   EffectState,
  // } = await import('@neoframe/electron-window-corner-addon');

  const projectName = path.basename(projectPath, '.gbasproj');
  const ses = session.fromPartition(projectName);

  // Try to find an active window for the project
  const existingWindow = opened.get(projectPath);

  if (existingWindow) {
    if (existingWindow.isMinimized()) {
      existingWindow.restore();
    }

    existingWindow.focus();

    return existingWindow;
  }

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    ...process.platform === 'darwin' && {
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: {
        x: 24,
        y: 24,
      },
      frame: false,
      transparent: true,
      vibrancy: 'under-window',
    },
    ...process.platform === 'win32' && {
      autoHideMenuBar: false,
      backgroundColor: nativeTheme.shouldUseDarkColors
        ? '#1A1A1A'
        : '#FAFAFA',
    },
    webPreferences: {
      preload: path.join(app.getAppPath(), './.vite/build/preload.js'),
      contextIsolation: true,
      partition: projectName,
      devTools: false,
      ...MAIN_WINDOW_VITE_DEV_SERVER_URL && {
        devTools: true,
      },
    },
  });

  opened.set(projectPath, win);

  win.on('closed', () => {
    opened.delete(projectPath);
  });

  // Enable crossOriginIsolated for mgba/wasm
  win.webContents.session.webRequest
    .onHeadersReceived((details, callback) => {
      if (!details.responseHeaders) {
        details.responseHeaders = {};
      }

      details.responseHeaders['Cross-Origin-Opener-Policy'] = ['same-origin'];
      details.responseHeaders['Cross-Origin-Embedder-Policy'] =
        ['require-corp'];

      callback({ responseHeaders: details.responseHeaders });
    });

  ses.protocol.handle('project', req => {
    const filePath = req.url.replace('project://', '');

    return net.fetch(url.pathToFileURL(path
      .join(path.dirname(projectPath), filePath)).toString());
  });

  ses.protocol.handle('resources', req => {
    const filePath = req.url.replace('resources://', '');

    return net.fetch(url.pathToFileURL(path
      .join(getResourcesDir(), filePath)).toString());
  });

  const abortController = new AbortController();

  win.on('close', () => {
    ses.protocol.unhandle('project');
    ses.protocol.unhandle('resources');
    abortController.abort();
  });

  createGraphicsFileWatcher(projectPath, win, abortController.signal);
  createAudioFileWatcher(projectPath, win, abortController.signal);

  win.maximize();

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    const url = new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL);

    url.searchParams.set('projectPath', projectPath);
    url.searchParams.set('projectBase', path.dirname(projectPath));
    url.searchParams.set('resourcesPath', getResourcesDir());
    url.searchParams.set('isDev', '' + !app.isPackaged);
    url.searchParams.set('theme',
      nativeTheme.shouldUseDarkColors ? 'dark' : 'light');

    win.loadURL(url.toString(), {
      extraHeaders: 'Cross-Origin-Opener-Policy: same-origin\n' +
        'Cross-Origin-Embedder-Policy: require-corp',
    });
  } else {
    win.loadFile(
      path.join(app.getAppPath(),
        `./.vite/renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      { query: {
        projectPath,
        projectBase: path.dirname(projectPath),
        isDev: '' + !app.isPackaged,
        theme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
        resourcesPath: getResourcesDir(),
      } },
    );
  }

  win.show();

  // WindowCorner.setCornerRadius(
  //   win,
  //   26,
  //   VibrancyMaterial.WINDOW_BACKGROUND,
  //   EffectState.ACTIVE,
  // );

  return win;
};
