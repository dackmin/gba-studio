/// <reference types="electron" />
/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />
/// <reference types="./src/types.ts" />

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
  browseProjects(): Promise<string>;
  loadProject(path: string): Promise<AppPayload>;
  saveProject(path: string, payload: Partial<AppPayload>): Promise<void>;
  getDirectoryPath(opts?: {
    prefix?: string;
    suffix?: string;
  }): Promise<string>;
  createProject(opts: {
    type: ProjectTemplate;
    name: string;
    path: string;
  }): Promise<void>;
  isFullscreen(): Promise<boolean>;
  startBuildProject(
    projectPath: string,
    data?: Partial<AppPayload>
  ): Promise<string>;
  abortBuildProject(buildId?: string): Promise<void>;
  getRomPath(projectPath: string): Promise<string>;
  getEditorConfig(): Promise<AppStorage>;
  setEditorConfig(config: AppStorage): Promise<void>;
  getResourcesPath(): Promise<string>;
  registerClipboard(data: any): Promise<void>;
  getClipboard(): Promise<any>;
  platform: string;
  isDarwin: boolean;
  isWindows: boolean;
}

interface Window {
  electron: AppBridge;
};

declare module '*.svg?url' {
  const content: string;
  export default content;
}

declare module '*.png?url' {
  const content: string;
  export default content;
}
