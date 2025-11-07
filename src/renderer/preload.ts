import { contextBridge, ipcRenderer } from 'electron/renderer';

import type {
  AppPayload,
  AppStorage,
  ProjectTemplate,
  RecentProject,
} from '../types';

contextBridge.exposeInMainWorld('electron', {
  // EventTarget
  addEventListener: (channel: string, func: (...args: any[]) => void) => {
    ipcRenderer.addListener(channel, func);

    return () => {
      ipcRenderer.removeListener(channel, func);
    };
  },
  removeEventListener: (channel: string, func: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, func);
  },

  // Invokables
  getRecentProjects: (): Promise<RecentProject[]> =>
    ipcRenderer.invoke('get-recent-projects'),
  clearRecentProjects: () =>
    ipcRenderer.invoke('clear-recent-projects'),
  loadRecentProject: (projectPath: string) =>
    ipcRenderer.invoke('load-recent-project', projectPath),
  browseProjects: () =>
    ipcRenderer.invoke('browse-projects'),
  loadProject: (path: string): Promise<AppPayload> =>
    ipcRenderer.invoke('load-project', path),
  saveProject: (path: string, payload: AppPayload): Promise<void> =>
    ipcRenderer.invoke('save-project', path, payload),
  getDirectoryPath: (opts?: {
    prefix?: string;
    suffix?: string;
  }): Promise<string> =>
    ipcRenderer.invoke('get-directory-path', opts),
  createProject: (opts: {
    type: ProjectTemplate;
    name: string;
    path: string;
  }): Promise<void> =>
    ipcRenderer.invoke('create-project', opts),
  isFullscreen: (): Promise<boolean> =>
    ipcRenderer.invoke('is-fullscreen'),
  startBuildProject: (
    projectPath: string,
    data?: Partial<AppPayload>
  ): Promise<string> =>
    ipcRenderer.invoke('start-build-project', projectPath, data),
  abortBuildProject: (buildId?: string): Promise<void> =>
    ipcRenderer.invoke('abort-build-project', buildId),
  getRomPath: (projectPath: string): Promise<string> =>
    ipcRenderer.invoke('get-rom-path', projectPath),
  getEditorConfig: (): Promise<AppStorage> =>
    ipcRenderer.invoke('get-editor-config'),
  setEditorConfig: (config: AppStorage): Promise<void> =>
    ipcRenderer.invoke('set-editor-config', config),
  getResourcesPath: (): Promise<string> =>
    ipcRenderer.invoke('get-resources-path'),
  registerClipboard: (data: any): Promise<void> =>
    ipcRenderer.invoke('register-clipboard', data),
  getClipboard: (): Promise<any> =>
    ipcRenderer.invoke('get-clipboard'),

  // Info
  platform: process.platform,
  isDarwin: process.platform === 'darwin',
  isWindows: process.platform === 'win32',
} as Omit<AppBridge, 'dispatchEvent'>);
