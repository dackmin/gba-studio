import type { GameScene, HostContext } from '../../types';
import { renameContentFile } from '../files';

export default async function (
  ctx: HostContext,
  projectPath: string,
  currentFileName: string,
  sceneData?: Partial<GameScene>,
): Promise<string | null> {
  return renameContentFile(
    ctx.dialogs, 'scene', projectPath, currentFileName, sceneData);
}
