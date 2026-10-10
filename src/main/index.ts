// import path from 'node:path';
// import { createRequire } from 'node:module';

import { app, ipcMain, protocol } from 'electron';
import started from 'electron-squirrel-startup';

import { createSelectionWindow } from './windows';
import {
  createBeforeReadyEventListeners,
  createEventListeners,
} from './events';
import { createElectronContext } from './contexts/electron';
import { createHandlers } from './registry';
import Storage from './storage';

// electron-window-corner-addon polyfill
// global.require = createRequire(import.meta.url);

app.commandLine.appendSwitch('js-flags', '--max-old-space-size=2048');
app.commandLine.appendSwitch('force_high_performance_gpu');
app.commandLine.appendSwitch('force-gpu-mem-available-mb', '2048');
app.commandLine.appendSwitch('enable-features','SharedArrayBuffer');

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
  { scheme: 'app', privileges: {
    standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true,
  } },
]);

const storage = new Storage(app.getPath('userData'));

// Needs to be called before app is ready
createBeforeReadyEventListeners();

app.whenReady().then(() => {
  createEventListeners();
  createSelectionWindow();
});

for (const [channel, handler] of Object.entries(createHandlers(storage))) {
  ipcMain.handle(channel, (event, ...args) =>
    handler(createElectronContext(event), ...args));
}
