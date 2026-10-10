import type {
  AppPayload,
  AppStorage,
  BuildOptions,
  GameBackgroundFile,
  GameMusicFile,
  GameProject,
  GameScene,
  GameScript,
  GameSoundFile,
  GameSpriteFile,
  ProjectTemplate,
  RecentProject,
  SpriteBitmap,
} from './app';

export interface FileFilter {
  name: string;
  extensions: string[];
}

export type BuildData = Partial<Omit<AppPayload, 'project'>> & {
  project?: Partial<GameProject>;
};

export interface AppBridge {
  addEventListener(
    channel: string,
    func: ((...args: any[]) => void)
  ): (() => void);
  removeEventListener(
    channel: string,
    func: ((...args: any[]) => void)
  ): void;
  send(channel: string, ...args: any[]): void;

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
  startBuildProject(
    projectPath: string,
    data?: BuildData,
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
    filePath: string,
    mode: 'sprite' | 'background',
    opts?: {
      transparencyColor?: string;
    },
  ): Promise<SpriteBitmap>;
  importSprite(
    projectPath: string,
    filePath: string,
    spriteInfo: Partial<GameSpriteFile>,
  ): Promise<GameSpriteFile>;
  importBackground(
    projectPath: string,
    filePath: string,
    backgroundInfo: Partial<GameBackgroundFile>,
  ): Promise<GameBackgroundFile>;
  importSound(
    projectPath: string,
    filePath: string,
    soundInfo: Partial<GameSoundFile>,
  ): Promise<GameSoundFile>;
  importMusic(
    projectPath: string,
    filePath: string,
    musicInfo: Partial<GameMusicFile>,
  ): Promise<GameMusicFile>;
  renameSceneFile(
    projectPath: string,
    currentFileName: string,
    sceneData?: Partial<GameScene>,
  ): Promise<string | null>;
  renameScriptFile(
    projectPath: string,
    currentFileName: string,
    scriptData?: Partial<GameScript>,
  ): Promise<string | null>;
  showUnsavedChangesDialog(): Promise<'save' | 'discard' | 'cancel'>;
  confirmClose(): Promise<void>;
  cancelClose(): Promise<void>;

  platform: string;
  isDarwin: boolean;
  isWindows: boolean;
  isDev: boolean;
  isFullscreen: boolean;
}
