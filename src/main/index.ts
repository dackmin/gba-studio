// import path from 'node:path';
// import { createRequire } from 'node:module';

import {
  BrowserWindow,
  app,
  ipcMain,
  protocol,
} from 'electron';
import started from 'electron-squirrel-startup';

import { createMenus } from './menus';
import { createSelectionWindow } from './windows';
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
} from './handles';
import Storage from './storage';

// electron-window-corner-addon polyfill
// global.require = createRequire(import.meta.url);

if (started) {
  app.quit();
}

protocol.registerSchemesAsPrivileged([
  { scheme: 'project', privileges: { bypassCSP: true } },
]);

createMenus();

const storage = new Storage();

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

ipcMain.handle('get-recent-projects', getRecentProjects.bind(null, storage));
ipcMain.handle('load-recent-project', loadRecentProject);
ipcMain.handle('browse-projects', browseProjects);
ipcMain.handle('load-project', loadProject.bind(null, storage));
ipcMain.handle('save-project', saveProject);
ipcMain.handle('get-directory-path', getDirectoryPath);
ipcMain.handle('create-project', createProject.bind(null, storage));
ipcMain.handle('is-fullscreen', isFullscreen);
ipcMain.handle('start-build-project', startBuildProject);
ipcMain.handle('abort-build-project', abortBuildProject);
ipcMain.handle('get-rom-path', getRomPath);
ipcMain.handle('clear-recent-projects',
  clearRecentProjects.bind(null, storage));
