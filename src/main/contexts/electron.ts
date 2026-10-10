import { type IpcMainInvokeEvent, BrowserWindow, dialog, shell } from 'electron';

import type { HostContext } from '../../types';
import { allowWindowClose, createProjectWindow, setQuitting } from '../windows';

export const createElectronContext = (event: IpcMainInvokeEvent): HostContext => {
  const getWindow = () => BrowserWindow.fromWebContents(event.sender);

  return {
    send: (channel, payload) => {
      if (payload === undefined) {
        event.sender.send(channel);
      } else {
        event.sender.send(channel, payload);
      }
    },
    dialogs: {
      openDirectory: async () => {
        const result = await dialog.showOpenDialog({
          properties: ['openDirectory'],
        });

        return result.filePaths[0] || null;
      },
      openFile: async opts => {
        const result = await dialog.showOpenDialog({
          properties: ['openFile'],
          filters: opts?.filters || [],
          defaultPath: opts?.defaultPath,
        });

        return result.filePaths[0] || null;
      },
      openProject: async () => {
        const result = await dialog.showOpenDialog({
          properties: ['openDirectory', 'openFile'],
        });

        return result.filePaths[0] || null;
      },
      saveFile: async opts => {
        const result = await dialog.showSaveDialog(opts);

        return result.canceled || !result.filePath ? null : result.filePath;
      },
      confirmUnsavedChanges: async () => {
        const choices = ['save', 'discard', 'cancel'] as const;
        const { response } = await dialog.showMessageBox(getWindow()!, {
          type: 'warning',
          buttons: ['Save', 'Don\'t Save', 'Cancel'],
          defaultId: 0,
          cancelId: 2,
          message: 'Do you want to save the changes you made to this project?',
          detail: 'Your changes will be lost if you don\'t save them.',
        });

        return choices[response];
      },
      showError: async (title, message) => {
        dialog.showErrorBox(title, message);
      },
    },
    shell: {
      showItemInFolder: async filePath => {
        shell.showItemInFolder(filePath);
      },
    },
    window: {
      setProgress: async value => {
        getWindow()?.setProgressBar(value);
      },
      allowClose: async () => {
        const win = getWindow();

        if (win) {
          allowWindowClose(win);
        }
      },
      cancelQuit: async () => {
        setQuitting(false);
      },
      openProject: async projectPath => {
        const win = getWindow();
        win?.hide();

        createProjectWindow(projectPath);

        await new Promise(resolve => setTimeout(resolve, 100));
        win?.close();
      },
    },
  };
};
