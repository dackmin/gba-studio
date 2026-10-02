import type { IpcMainInvokeEvent } from 'electron';

import type { GameScript } from '../../types';
import { renameContentFile } from '../files';

export default async function (
  _: IpcMainInvokeEvent,
  projectPath: string,
  currentFileName: string,
  scriptData?: Partial<GameScript>,
): Promise<string | null> {
  return renameContentFile('script', projectPath, currentFileName, scriptData);
}
