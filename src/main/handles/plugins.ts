import path from 'node:path';

import { type IpcMainInvokeEvent, BrowserWindow, dialog, shell } from 'electron';
import fse from 'fs-extra';

import type { GamePlugin, PluginPick, ProjectPlugin } from '../../types';
import {
  PLUGIN_MANIFEST,
  loadPlugins,
  pickPlugin as pick,
  registerPluginDirs,
} from '../plugins';

export const getPlugins = async (
  _event: IpcMainInvokeEvent,
  projectPath: string,
  entries?: ProjectPlugin[],
): Promise<GamePlugin[]> => {
  const plugins = await loadPlugins(projectPath, entries);

  registerPluginDirs(projectPath, plugins);

  return plugins;
};

export const pickPlugin = async (
  event: IpcMainInvokeEvent,
  projectPath: string,
): Promise<PluginPick | null> => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win!, {
    title: 'Select a plugin folder',
    properties: ['openDirectory'],
  });

  if (!result.filePaths[0]) {
    return null;
  }

  return pick(projectPath, result.filePaths[0]);
};

export const openPluginFolder = async (
  _event: IpcMainInvokeEvent,
  dir: string,
): Promise<void> => {
  if (await fse.pathExists(path.join(dir, PLUGIN_MANIFEST))) {
    await shell.openPath(dir);
  }
};
