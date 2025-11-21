import path from 'node:path';
import fs from 'node:fs';

import { app, BrowserWindow, globalShortcut } from 'electron';

import type { GameBackgroundFile, GameSpriteFile } from '../types';
import { createProjectWindow, createSelectionWindow } from './windows';
import { getGraphicsFiles, getSoundFiles } from './files';

export const createBeforeReadyEventListeners = () => {
  app.on('open-file', (event, path) => {
    event.preventDefault();
    createProjectWindow(path);
  });
};

export const createEventListeners = () => {
  // Disable DevTools in production
  if (!MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    globalShortcut.register('Control+Shift+I', () => {
      return false;
    });
  }

  // Quit when all windows are closed (all but macOS)
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // Reopen selection window when all windows are closed (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createSelectionWindow();
    }
  });
};

export const createGraphicsFileWatcher = async (
  projectPath: string,
  win: BrowserWindow,
  signal?: AbortSignal,
) => {
  const projectBase = path.dirname(projectPath);

  if (!fs.existsSync(path.join(projectBase, 'graphics'))) {
    await fs.promises.mkdir(path.join(projectBase, 'graphics'));
  }

  fs.watch(
    path.join(projectBase, 'graphics'),
    { signal },
    async () => {
      const files = await getGraphicsFiles(
        projectBase,
        file => file.endsWith('.json')
      );

      const sprites: GameSpriteFile[] = [];
      const backgrounds: GameBackgroundFile[] = [];

      for (const file of files) {
        try {
          const graphic: GameSpriteFile | GameBackgroundFile = JSON.parse(
            await fs.promises
              .readFile(path.join(projectBase, 'graphics', file), 'utf-8')
          );

          if (['sprite'].includes(graphic.type)) {
            sprites.push(graphic);
          } else if (['regular_bg'].includes(graphic.type)) {
            backgrounds.push(graphic);
          }

          graphic._file = file;
        } catch {}
      }

      win.webContents.send('graphics-updated', { sprites, backgrounds });
    },
  );
};

export const createAudioFileWatcher = async (
  projectPath: string,
  win: BrowserWindow,
  signal?: AbortSignal,
) => {
  const projectBase = path.dirname(projectPath);

  if (!fs.existsSync(path.join(projectBase, 'audio'))) {
    await fs.promises.mkdir(path.join(projectBase, 'audio'));
  }

  fs.watch(
    path.join(projectBase, 'audio'),
    { signal },
    async () => {
      const music = await getSoundFiles(
        projectBase,
        file => file.endsWith('.mod') || file.endsWith('.s3m') ||
          file.endsWith('.xm') || file.endsWith('.it') || file.endsWith('.vgm')
      );

      const sounds = await getSoundFiles(
        projectBase,
        file => file.endsWith('.wav')
      );

      win.webContents.send('audio-updated', { music, sounds });
    },
  );
};
