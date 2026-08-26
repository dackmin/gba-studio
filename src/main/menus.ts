import {
  type MenuItemConstructorOptions,
  app,
  shell,
  BrowserWindow,
  Menu,
} from 'electron';

import { createSelectionWindow } from './windows';

export const createMenus = (type: 'project-selection' | 'editor') => {
  const isMac = process.platform === 'darwin';
  const isDev = !!MAIN_WINDOW_VITE_DEV_SERVER_URL;

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] as MenuItemConstructorOptions[] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: async () => {
            createSelectionWindow('new-project');
          },
        },
        {
          label: 'Open Project',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            if (type === 'editor') {
              createSelectionWindow();
            } else {
              const focusedWindow = BrowserWindow.getFocusedWindow();

              if (focusedWindow) {
                focusedWindow.webContents.send('browse-project');
              }
            }
          },
        },
        ...type === 'editor' ? [
          { type: 'separator' },
          {
            label: 'Import...',
            submenu: [
              {
                label: 'Sprite',
                click: async () => {
                  const focusedWindow = BrowserWindow.getFocusedWindow();

                  if (focusedWindow) {
                    focusedWindow.webContents.send('import-sprite');
                  }
                },
              },
              {
                label: 'Background',
                click: async () => {
                  const focusedWindow = BrowserWindow.getFocusedWindow();

                  if (focusedWindow) {
                    focusedWindow.webContents.send('import-background');
                  }
                },
              },
              {
                label: 'Sound',
                click: async () => {
                  const focusedWindow = BrowserWindow.getFocusedWindow();

                  if (focusedWindow) {
                    focusedWindow.webContents.send('import-sound');
                  }
                },
              },
              {
                label: 'Music',
                click: async () => {
                  const focusedWindow = BrowserWindow.getFocusedWindow();

                  if (focusedWindow) {
                    focusedWindow.webContents.send('import-music');
                  }
                },
              },
            ],
          },
        ] as MenuItemConstructorOptions[] : [],
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();

            if (focusedWindow) {
              focusedWindow.webContents.send('undo');
            }
          },
        },
        {
          label: 'Redo',
          accelerator: 'CmdOrCtrl+Shift+Z',
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();

            if (focusedWindow) {
              focusedWindow.webContents.send('redo');
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();

            if (focusedWindow) {
              focusedWindow.webContents.cut();
              focusedWindow.webContents.send('cut');
            }
          },
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();

            if (focusedWindow) {
              focusedWindow.webContents.copy();
              focusedWindow.webContents.send('copy');
            }
          },
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();

            if (focusedWindow) {
              focusedWindow.webContents.paste();
              focusedWindow.webContents.send('paste');
            }
          },
        },
        { role: 'delete' },
        { role: 'selectAll' },
      ],
    },
    ...type === 'editor' ? [{
      label: 'Build',
      submenu: [
        {
          label: 'Build Project',
          accelerator: 'CmdOrCtrl+Enter',
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();

            if (focusedWindow) {
              focusedWindow.webContents.send('build-project');
            }
          },
        },
        {
          label: 'Clean Build Folder',
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();

            if (focusedWindow) {
              focusedWindow.webContents.send('clean-build-folder');
            }
          },
        },
        {
          label: 'Clean And Rebuild Project',
          accelerator: 'CmdOrCtrl+Shift+Enter',
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();

            if (focusedWindow) {
              focusedWindow.webContents.send('rebuild-project');
            }
          },
        },
      ],
    }] : [],
    {
      label: 'View',
      submenu: [
        ...isDev ? [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
        ] as MenuItemConstructorOptions[] : [],
        { role: 'togglefullscreen' },
      ],
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        ...(isMac
          ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' },
          ] as MenuItemConstructorOptions[]
          : [{ role: 'close' }] as MenuItemConstructorOptions[]),
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://github.com/dackmin/gba-studio');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);

  return menu;
};

export const projectSelectionMenu = createMenus('project-selection');
export const editorMenu = createMenus('editor');
