import { type FileFilter, contextBridge, ipcRenderer } from 'electron';

import type {
  AppPayload,
  AppStorage,
  BuildOptions,
  GameBackgroundFile,
  GameMusicFile,
  GameSoundFile,
  GameSpriteFile,
  ProjectTemplate,
  RecentProject,
  SpriteBitmap,
} from '../types';

const queryParams = new URLSearchParams(globalThis.location.search);
const isDev = queryParams.get('isDev') === 'true';
const isFullscreen = queryParams.get('isFullscreen') === 'true';

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
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.emit(channel, ...args);
  },

  // Invokables
  getRecentProjects: (): Promise<RecentProject[]> =>
    ipcRenderer.invoke('get-recent-projects'),
  clearRecentProjects: () =>
    ipcRenderer.invoke('clear-recent-projects'),
  loadRecentProject: (projectPath: string) =>
    ipcRenderer.invoke('load-recent-project', projectPath),
  removeRecentProject: (projectPath: string) =>
    ipcRenderer.invoke('remove-recent-project', projectPath),
  browseProject: () =>
    ipcRenderer.invoke('browse-project'),
  loadProject: (path: string): Promise<AppPayload> =>
    ipcRenderer.invoke('load-project', path),
  saveProject: (path: string, payload: AppPayload): Promise<void> =>
    ipcRenderer.invoke('save-project', path, payload),
  browseDirectory: (opts?: {
    prefix?: string;
    suffix?: string;
  }): Promise<string> =>
    ipcRenderer.invoke('browse-directory', opts),
  browseFile: (opts?: {
    prefix?: string;
    filters?: FileFilter[];
    projectPath?: string;
  }): Promise<string> =>
    ipcRenderer.invoke('browse-file', opts),
  createProject: (opts: {
    type: ProjectTemplate;
    name: string;
    path: string;
  }): Promise<void> =>
    ipcRenderer.invoke('create-project', opts),
  startBuildProject: (
    projectPath: string,
    data?: Partial<AppPayload>,
    opts?: BuildOptions
  ): Promise<string> =>
    ipcRenderer.invoke('start-build-project', projectPath, data, opts),
  abortBuildProject: (buildId?: string): Promise<void> =>
    ipcRenderer.invoke('abort-build-project', buildId),
  cleanBuildFolder: (projectPath?: string): Promise<void> =>
    ipcRenderer.invoke('clean-build-folder', projectPath),
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
  openParentFolder: (projectPath: string, filePath: string): Promise<void> =>
    ipcRenderer.invoke('open-parent-folder', projectPath, filePath),
  getProjectRelativePath: (projectPath: string, filePath: string): Promise<string> =>
    ipcRenderer.invoke('get-project-relative-path', projectPath, filePath),
  loadImage: (
    filePath: string,
    mode: 'sprite' | 'background',
    opts?: {
      transparencyColor?: string;
    }
  ): Promise<SpriteBitmap> =>
    ipcRenderer.invoke('load-image', filePath, mode, opts),
  importSprite: (
    projectPath: string,
    filePath: string,
    spriteInfo: Partial<GameSpriteFile>,
  ): Promise<Partial<GameSpriteFile>> =>
    ipcRenderer.invoke('import-sprite', projectPath, filePath, spriteInfo),
  importBackground: (
    projectPath: string,
    filePath: string,
    backgroundInfo: Partial<GameBackgroundFile>,
  ): Promise<Partial<GameBackgroundFile>> =>
    ipcRenderer.invoke('import-background', projectPath, filePath, backgroundInfo),
  importSound: (
    projectPath: string,
    filePath: string,
    soundInfo: Partial<GameSoundFile>,
  ): Promise<Partial<GameSoundFile>> =>
    ipcRenderer.invoke('import-sound', projectPath, filePath, soundInfo),
  importMusic: (
    projectPath: string,
    filePath: string,
    musicInfo: Partial<GameMusicFile>,
  ): Promise<Partial<GameMusicFile>> =>
    ipcRenderer.invoke('import-music', projectPath, filePath, musicInfo),

  // Info
  platform: process.platform,
  isDarwin: process.platform === 'darwin',
  isWindows: process.platform === 'win32',
  isDev,
  isFullscreen,
} as Omit<AppBridge, 'dispatchEvent'>);
