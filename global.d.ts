/// <reference types="electron" />
/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />
/// <reference types="./src/types.ts" />
/// <reference types="jimp" />

interface ImportMetaEnv {
  readonly VITE_SCHEMAS_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface AppBridge extends EventTarget {
  addEventListener(
    channel: string,
    func: ((...args: any[]) => void)
  ): void;
  removeEventListener(
    channel: string,
    func: ((...args: any[]) => void)
  ): void;

  getRecentProjects(): Promise<RecentProject[]>;
  clearRecentProjects(): Promise<void>;
  loadRecentProject(projectPath: string): Promise<void>;
  removeRecentProject(projectPath: string): Promise<void>;
  browseDirectory(opts?: {
    prefix?: string;
    suffix?: string;
  }): Promise<string>;
  browseFile(opts?: {
    prefix?: string;
    filters?: FileFilter[];
    projectPath?: string;
  }): Promise<string>;
  browseProject(): Promise<string>;
  loadProject(path: string): Promise<AppPayload>;
  saveProject(path: string, payload: Partial<AppPayload>): Promise<void>;
  createProject(opts: {
    type: ProjectTemplate;
    name: string;
    path: string;
  }): Promise<void>;
  isFullscreen(): Promise<boolean>;
  startBuildProject(
    projectPath: string,
    data?: Partial<AppPayload>,
    opts?: BuildOptions,
  ): Promise<string>;
  cleanBuildFolder(projectPath?: string): Promise<void>;
  abortBuildProject(buildId?: string): Promise<void>;
  getRomPath(projectPath: string): Promise<string>;
  getEditorConfig(): Promise<AppStorage>;
  setEditorConfig(config: AppStorage): Promise<void>;
  getResourcesPath(): Promise<string>;
  registerClipboard(data: any): Promise<void>;
  getClipboard(): Promise<any>;
  openParentFolder(projectPath: string, filePath: string): Promise<void>;
  getProjectRelativePath(projectPath: string, filePath: string): Promise<string>;
  loadImage(
    projectPath: string,
    filePath: string,
    mode: 'sprite' | 'background'
  ): Promise<SpriteBitmap>;
  importSprite(
    projectPath: string,
    filePath: string,
    spriteInfo: Partial<GameSpriteFile>,
  ): Promise<Partial<GameSpriteFile>>;
  importBackground(
    projectPath: string,
    filePath: string,
    backgroundInfo: Partial<GameBackgroundFile>,
  ): Promise<Partial<GameBackgroundFile>>;
  importSound(
    projectPath: string,
    filePath: string,
    soundInfo: Partial<GameSoundFile>,
  ): Promise<Partial<GameSoundFile>>;
  importMusic(
    projectPath: string,
    filePath: string,
    musicInfo: Partial<GameMusicFile>,
  ): Promise<Partial<GameMusicFile>>;
  platform: string;
  isDarwin: boolean;
  isWindows: boolean;
}

interface Window {
  electron: AppBridge;
}

declare module '*.svg?url' {
  const content: string;
  export default content;
}

declare module '*.png?url' {
  const content: string;
  export default content;
}
