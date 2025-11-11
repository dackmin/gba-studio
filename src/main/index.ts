// import path from 'node:path';
// import { createRequire } from 'node:module';

import { app, ipcMain, protocol } from 'electron';
import started from 'electron-squirrel-startup';

import { createMenus } from './menus';
import { createSelectionWindow } from './windows';
import {
  createBeforeReadyEventListeners,
  createEventListeners,
} from './events';
import {
  browseProjects,
  getRecentProjects,
  loadRecentProject,
  loadProject,
  saveProject,
  getDirectoryPath,
  createProject,
  isFullscreen,
  startBuildProject,
  abortBuildProject,
  getRomPath,
  clearRecentProjects,
  getEditorConfig,
  setEditorConfig,
  getResourcesPath,
  registerClipboard,
  getClipboard,
} from './handles';
import Storage from './storage';

// electron-window-corner-addon polyfill
// global.require = createRequire(import.meta.url);

if (started) {
  app.quit();
}

// Allow project files to bypass CSP rules
protocol.registerSchemesAsPrivileged([
  { scheme: 'project', privileges: { bypassCSP: true } },
]);

const storage = new Storage();

// Needs to be called before app is ready
createBeforeReadyEventListeners();
createMenus();

app.whenReady().then(() => {
  createEventListeners();
  createSelectionWindow();
});

ipcMain.handle('get-recent-projects', getRecentProjects.bind(null, storage));
ipcMain.handle('load-recent-project', loadRecentProject);
ipcMain.handle('browse-projects', browseProjects);
ipcMain.handle('load-project', loadProject.bind(null, storage));
ipcMain.handle('save-project', saveProject);
ipcMain.handle('get-directory-path', getDirectoryPath);
ipcMain.handle('create-project', createProject.bind(null, storage));
ipcMain.handle('is-fullscreen', isFullscreen);
ipcMain.handle('start-build-project', startBuildProject.bind(null, storage));
ipcMain.handle('abort-build-project', abortBuildProject);
ipcMain.handle('get-rom-path', getRomPath);
ipcMain.handle('clear-recent-projects',
  clearRecentProjects.bind(null, storage));
ipcMain.handle('get-editor-config', getEditorConfig.bind(null, storage));
ipcMain.handle('set-editor-config', setEditorConfig.bind(null, storage));
ipcMain.handle('get-resources-path', getResourcesPath);
ipcMain.handle('register-clipboard', registerClipboard.bind(null, storage));
ipcMain.handle('get-clipboard', getClipboard.bind(null, storage));
