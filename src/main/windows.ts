import path from 'node:path';
import url from 'node:url';

import { net, session, BrowserWindow, nativeTheme, app, Menu } from 'electron';

import { getResourcesDir } from './utils';
// import { createAudioFileWatcher, createGraphicsFileWatcher } from './events';
import { editorMenu, projectSelectionMenu } from './menus';

const opened: Map<string, BrowserWindow> = new Map();
let selectionWindow: BrowserWindow | null = null;

export const createSelectionWindow = async (action?: 'new-project' | 'browse-project') => {
  // Reuse the existing selection window instead of opening a new one
  if (selectionWindow && !selectionWindow.isDestroyed()) {
    if (selectionWindow.isMinimized()) {
      selectionWindow.restore();
    }

    selectionWindow.focus();

    if (action) {
      selectionWindow.webContents.send(action);
    }

    return selectionWindow;
  }

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
    ...process.platform === 'linux' && {
      backgroundColor: nativeTheme.shouldUseDarkColors
        ? '#1A1A1A'
        : '#FAFAFA',
      frame: false,
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
    url.searchParams.set('action', action || '');

    win.loadURL(url.toString());
  } else {
    win.loadFile(
      path.join(app.getAppPath(),
        `./.vite/renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      { query: {
        theme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
        action: action || '',
      } },
    );
  }

  win.show();

  Menu.setApplicationMenu(projectSelectionMenu);
  win.on('focus', () => {
    Menu.setApplicationMenu(projectSelectionMenu);
  });

  selectionWindow = win;
  win.on('closed', () => {
    if (selectionWindow === win) {
      selectionWindow = null;
    }
  });

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
    ...(process.platform === 'win32' || 'linux') && {
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
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    if (!details.responseHeaders) {
      details.responseHeaders = {};
    }

    details.responseHeaders['Cross-Origin-Opener-Policy'] = ['same-origin'];
    details.responseHeaders['Cross-Origin-Embedder-Policy'] = ['require-corp'];

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

  ses.protocol.handle('app', async req => {
    const { pathname } = new URL(req.url);
    const relativePath = pathname.replace(/^\/+/, '') || 'index.html';
    const filePath = path.join(
      app.getAppPath(),
      `./.vite/renderer/${MAIN_WINDOW_VITE_NAME}`,
      relativePath,
    );

    const response = await net.fetch(url.pathToFileURL(filePath).toString());
    const headers = new Headers(response.headers);
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  });

  const abortController = new AbortController();

  win.on('close', () => {
    ses.protocol.unhandle('project');
    ses.protocol.unhandle('resources');
    ses.protocol.unhandle('app');
    abortController.abort();
  });

  // createGraphicsFileWatcher(projectPath, win, abortController.signal);
  // createAudioFileWatcher(projectPath, win, abortController.signal);

  win.maximize();

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    const url = new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL);

    url.searchParams.set('projectPath', projectPath);
    url.searchParams.set('projectBase', path.dirname(projectPath));
    url.searchParams.set('resourcesPath', getResourcesDir());
    url.searchParams.set('isFullscreen', '' + win.isFullScreen());
    url.searchParams.set('isDev', '' + !app.isPackaged);
    url.searchParams.set('theme',
      nativeTheme.shouldUseDarkColors ? 'dark' : 'light');

    win.loadURL(url.toString(), {
      extraHeaders: 'Cross-Origin-Opener-Policy: same-origin\n' +
        'Cross-Origin-Embedder-Policy: require-corp',
    });
  } else {
    const appUrl = new URL('app://bundle/index.html');

    appUrl.searchParams.set('projectPath', projectPath);
    appUrl.searchParams.set('projectBase', path.dirname(projectPath));
    appUrl.searchParams.set('isFullscreen', '' + win.isFullScreen());
    appUrl.searchParams.set('isDev', '' + !app.isPackaged);
    appUrl.searchParams.set('theme',
      nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
    appUrl.searchParams.set('resourcesPath', getResourcesDir());

    win.loadURL(appUrl.toString());
  }

  win.on('enter-full-screen', () => {
    win.webContents.send('fullscreen-updated', true);
  });

  win.on('leave-full-screen', () => {
    win.webContents.send('fullscreen-updated', false);
  });

  win.show();

  Menu.setApplicationMenu(editorMenu);
  win.on('focus', () => {
    Menu.setApplicationMenu(editorMenu);
  });

  // WindowCorner.setCornerRadius(
  //   win,
  //   26,
  //   VibrancyMaterial.WINDOW_BACKGROUND,
  //   EffectState.ACTIVE,
  // );

  return win;
};
