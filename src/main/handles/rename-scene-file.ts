import type { IpcMainInvokeEvent } from 'electron';

import type { GameScene } from '../../types';
import { renameContentFile } from '../files';

export default async function (
  _: IpcMainInvokeEvent,
  projectPath: string,
  currentFileName: string,
  sceneData?: Partial<GameScene>,
): Promise<string | null> {
  return renameContentFile('scene', projectPath, currentFileName, sceneData);
}
