import type { FileFilter } from './bridge';

export interface HostDialogs {
  openDirectory(): Promise<string | null>;
  openFile(opts?: {
    filters?: FileFilter[];
    defaultPath?: string;
  }): Promise<string | null>;
  /** A `.gbasproj` file or a directory containing one */
  openProject(): Promise<string | null>;
  saveFile(opts: {
    title?: string;
    defaultPath?: string;
    filters?: FileFilter[];
  }): Promise<string | null>;
  confirmUnsavedChanges(): Promise<'save' | 'discard' | 'cancel'>;
  showError(title: string, message: string): Promise<void>;
}

/**
 * Everything a handler may need from the native shell, scoped to the window
 * that issued the request. Implemented by Electron today, and by the Tauri
 * shell (over the sidecar protocol) so handlers never import a runtime.
 */
export interface HostContext {
  /** Push an event to the requesting window */
  send(channel: string, payload?: unknown): void;
  dialogs: HostDialogs;
  shell: {
    showItemInFolder(filePath: string): Promise<void>;
  };
  window: {
    /** 0..1, or -1 to clear */
    setProgress(value: number): Promise<void>;
    /** Close the requesting window without asking again about unsaved changes */
    allowClose(): Promise<void>;
    /** Abort a pending quit so it doesn't resume once other windows close */
    cancelQuit(): Promise<void>;
    /** Open the editor for a project, then close the requesting (selection) window */
    openProject(projectPath: string): Promise<void>;
  };
}

export type Handler = (ctx: HostContext, ...args: any[]) => unknown;
