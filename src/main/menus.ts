import {
  type MenuItemConstructorOptions,
  app,
  shell,
  BrowserWindow,
  Menu,
} from 'electron';

import { createSelectionWindow } from './windows';

export const createMenus = () => {
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
          label: 'Open Project...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            createSelectionWindow();
          },
        },
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
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        ...isDev ? [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
        ] as MenuItemConstructorOptions[] : [],
        // { role: 'resetZoom' },
        // { role: 'zoomIn' },
        // { role: 'zoomOut' },
        // { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        // { role: 'zoom' },
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
            await shell.openExternal('https://github.com/neoframe/gba-studio');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};
