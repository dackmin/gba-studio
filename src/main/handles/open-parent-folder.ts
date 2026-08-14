import path from 'node:path';

import { type IpcMainInvokeEvent, shell } from 'electron';

export default async (
  _event: IpcMainInvokeEvent,
  projectPath: string,
  filePath: string
) => {
  const projectParent = path.dirname(projectPath);

  shell.showItemInFolder(filePath.startsWith('project://')
    ? path.join(projectParent, filePath.replace('project://', ''))
    : filePath);
};
