import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import type { AppBridge } from '../../types';

type Listener = (...args: any[]) => void;

const queryParams = new URLSearchParams(globalThis.location.search);
const ua = globalThis.navigator?.userAgent ?? '';
const platform = /Mac/i.test(ua) ? 'darwin' : /Win/i.test(ua) ? 'win32' : 'linux';

// Single router command on the Rust side; unported channels fall back to the Node sidecar.
const call = <T>(channel: string, ...args: unknown[]) =>
  invoke<T>('ipc_invoke', { channel, args });

export const createTauriBridge = (): AppBridge => {
  const listeners = new Map<string, Set<Listener>>();
  const unlisteners = new Map<Listener, Promise<() => void>>();

  const removeEventListener = (channel: string, func: Listener) => {
    listeners.get(channel)?.delete(func);
    unlisteners.get(func)?.then(off => off());
    unlisteners.delete(func);
  };

  return {
    addEventListener: (channel, func) => {
      if (!listeners.has(channel)) {
        listeners.set(channel, new Set());
      }

      listeners.get(channel)!.add(func);
      // Native events carry a single payload; none means a bare signal.
      unlisteners.set(func, listen<unknown>(channel, ({ payload }) => {
        if (payload === null || payload === undefined) {
          func();
        } else {
          func(payload);
        }
      }));

      return () => removeEventListener(channel, func);
    },
    removeEventListener,
    send: (channel, ...args) => {
      listeners.get(channel)?.forEach(func => func(...args));
    },

    getRecentProjects: () => call('get-recent-projects'),
    clearRecentProjects: () => call('clear-recent-projects'),
    loadRecentProject: projectPath => call('load-recent-project', projectPath),
    removeRecentProject: projectPath => call('remove-recent-project', projectPath),
    browseProject: () => call('browse-project'),
    loadProject: path => call('load-project', path),
    saveProject: (path, payload) => call('save-project', path, payload),
    browseDirectory: opts => call('browse-directory', opts),
    browseFile: opts => call('browse-file', opts),
    createProject: opts => call('create-project', opts),
    startBuildProject: (projectPath, data, opts) =>
      call('start-build-project', projectPath, data, opts),
    abortBuildProject: buildId => call('abort-build-project', buildId),
    cleanBuildFolder: projectPath => call('clean-build-folder', projectPath),
    getRomPath: projectPath => call('get-rom-path', projectPath),
    getEditorConfig: () => call('get-editor-config'),
    setEditorConfig: config => call('set-editor-config', config),
    getResourcesPath: () => call('get-resources-path'),
    registerClipboard: data => call('register-clipboard', data),
    getClipboard: () => call('get-clipboard'),
    openParentFolder: (projectPath, filePath) =>
      call('open-parent-folder', projectPath, filePath),
    getProjectRelativePath: (projectPath, filePath) =>
      call('get-project-relative-path', projectPath, filePath),
    loadImage: (filePath, mode, opts) => call('load-image', filePath, mode, opts),
    importSprite: (projectPath, filePath, info) =>
      call('import-sprite', projectPath, filePath, info),
    importBackground: (projectPath, filePath, info) =>
      call('import-background', projectPath, filePath, info),
    importSound: (projectPath, filePath, info) =>
      call('import-sound', projectPath, filePath, info),
    importMusic: (projectPath, filePath, info) =>
      call('import-music', projectPath, filePath, info),
    renameSceneFile: (projectPath, currentFileName, data) =>
      call('rename-scene-file', projectPath, currentFileName, data),
    renameScriptFile: (projectPath, currentFileName, data) =>
      call('rename-script-file', projectPath, currentFileName, data),
    showUnsavedChangesDialog: () => call('show-unsaved-changes-dialog'),
    confirmClose: () => call('confirm-close'),
    cancelClose: () => call('cancel-close'),

    platform,
    isDarwin: platform === 'darwin',
    isWindows: platform === 'win32',
    isDev: queryParams.get('isDev') === 'true',
    isFullscreen: queryParams.get('isFullscreen') === 'true',
  };
};

// Electron's preload already exposes the bridge; otherwise assume Tauri.
// Must run before any module reads window.bridge at load time.
if (!window.bridge) {
  window.bridge = createTauriBridge();
}
