import path from 'node:path';

import { type IpcMainInvokeEvent, BrowserWindow, dialog, shell } from 'electron';
import fse from 'fs-extra';

import type { GamePlugin, PluginPick, ProjectPlugin } from '../../types';
import { ARCHIVE_EXTENSIONS } from '../archive';
import {
  PLUGIN_MANIFEST,
  installPluginArchive,
  loadPlugins,
  registerPluginDirs,
  pickPlugin as pick,
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
  source: 'folder' | 'archive' = 'folder',
): Promise<PluginPick | null> => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win!, source === 'archive' ? {
    title: 'Select a plugin archive',
    properties: ['openFile'],
    filters: [{ name: 'Plugin archive', extensions: ARCHIVE_EXTENSIONS }],
  } : {
    title: 'Select a plugin folder',
    properties: ['openDirectory'],
  });

  if (!result.filePaths[0]) {
    return null;
  }

  return source === 'archive'
    ? installPluginArchive(projectPath, result.filePaths[0])
    : pick(projectPath, result.filePaths[0]);
};

export const openPluginFolder = async (
  _event: IpcMainInvokeEvent,
  dir: string,
): Promise<void> => {
  if (await fse.pathExists(path.join(dir, PLUGIN_MANIFEST))) {
    await shell.openPath(dir);
  }
};
