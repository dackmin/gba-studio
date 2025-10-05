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
  loadRecentProject(projectPath: string): Promise<void>;
  browseProjects(): Promise<string>;
  loadProject(path: string): Promise<AppPayload>;
  saveProject(path: string, payload: Partial<AppPayload>): Promise<void>;
  getDirectoryPath(opts?: {
    prefix?: string;
    suffix?: string;
  }): Promise<string>;
}

interface Window {
  electron: AppBridge;
};

declare module '*.svg?url' {
  const content: string;
  export default content;
}
