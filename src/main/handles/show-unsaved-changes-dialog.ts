import { type IpcMainInvokeEvent, BrowserWindow, dialog } from 'electron';

const choices = ['save', 'discard', 'cancel'] as const;

export default async (event: IpcMainInvokeEvent) => {
  const win = BrowserWindow.fromWebContents(event.sender);

  const { response } = await dialog.showMessageBox(win!, {
    type: 'warning',
    buttons: ['Save', 'Don\'t Save', 'Cancel'],
    defaultId: 0,
    cancelId: 2,
    message: 'Do you want to save the changes you made to this project?',
    detail: 'Your changes will be lost if you don\'t save them.',
  });

  return choices[response];
};
