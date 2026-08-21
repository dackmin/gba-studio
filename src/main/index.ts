// import path from 'node:path';
// import { createRequire } from 'node:module';

import { app, ipcMain, protocol } from 'electron';
import started from 'electron-squirrel-startup';

import { createSelectionWindow } from './windows';
import {
  createBeforeReadyEventListeners,
  createEventListeners,
} from './events';
import {
  browseDirectory,
  browseFile,
  browseProject,
  getRecentProjects,
  loadRecentProject,
  loadProject,
  saveProject,
  createProject,
  startBuildProject,
  abortBuildProject,
  getRomPath,
  clearRecentProjects,
  getEditorConfig,
  setEditorConfig,
  getResourcesPath,
  registerClipboard,
  getClipboard,
  cleanBuildFolder,
  openParentFolder,
  removeRecentProject,
  getProjectRelativePath,
  loadImage,
  importSprite,
  importBackground,
  importSound,
  importMusic,
} from './handles';
import Storage from './storage';

// electron-window-corner-addon polyfill
// global.require = createRequire(import.meta.url);

app.commandLine.appendSwitch('js-flags', '--max-old-space-size=2048');
app.commandLine.appendSwitch('force_high_performance_gpu');
app.commandLine.appendSwitch('force-gpu-mem-available-mb', '2048');

// Wayland users have issues with Vulkan & Chromium trying to render canvas/webgl
// Forcing either vulkan or opengl seems to do the trick
const isWayland = process.platform === 'linux' &&
  (
    process.env.XDG_SESSION_TYPE === 'wayland' ||
    Boolean(process.env.WAYLAND_DISPLAY)
  );

if (isWayland) {
  app.commandLine.appendSwitch('use-angle', 'vulkan');
}

if (started) {
  app.quit();
}

// Allow project files to bypass CSP rules
protocol.registerSchemesAsPrivileged([
  { scheme: 'project', privileges: {
    standard: true, bypassCSP: true, supportFetchAPI: true, corsEnabled: true,
  } },
  { scheme: 'resources', privileges: {
    standard: true, bypassCSP: true, supportFetchAPI: true, corsEnabled: true,
  } },
]);

const storage = new Storage();

// Needs to be called before app is ready
createBeforeReadyEventListeners();

app.whenReady().then(() => {
  createEventListeners();
  createSelectionWindow();
});

ipcMain.handle('get-recent-projects', getRecentProjects.bind(null, storage));
ipcMain.handle('load-recent-project', loadRecentProject);
ipcMain.handle('browse-directory', browseDirectory);
ipcMain.handle('browse-file', browseFile);
ipcMain.handle('browse-project', browseProject);
ipcMain.handle('load-project', loadProject.bind(null, storage));
ipcMain.handle('save-project', saveProject);
ipcMain.handle('create-project', createProject.bind(null, storage));
ipcMain.handle('start-build-project', startBuildProject.bind(null, storage));
ipcMain.handle('abort-build-project', abortBuildProject);
ipcMain.handle('get-rom-path', getRomPath);
ipcMain.handle('clear-recent-projects', clearRecentProjects.bind(null, storage));
ipcMain.handle('get-editor-config', getEditorConfig.bind(null, storage));
ipcMain.handle('set-editor-config', setEditorConfig.bind(null, storage));
ipcMain.handle('get-resources-path', getResourcesPath);
ipcMain.handle('register-clipboard', registerClipboard.bind(null, storage));
ipcMain.handle('get-clipboard', getClipboard.bind(null, storage));
ipcMain.handle('clean-build-folder', cleanBuildFolder);
ipcMain.handle('open-parent-folder', openParentFolder);
ipcMain.handle('remove-recent-project', removeRecentProject.bind(null, storage));
ipcMain.handle('get-project-relative-path', getProjectRelativePath);
ipcMain.handle('load-image', loadImage);
ipcMain.handle('import-sprite', importSprite);
ipcMain.handle('import-background', importBackground);
ipcMain.handle('import-sound', importSound);
ipcMain.handle('import-music', importMusic);
