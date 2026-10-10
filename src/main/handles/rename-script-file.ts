import type { GameScript, HostContext } from '../../types';
import { renameContentFile } from '../files';

export default async function (
  ctx: HostContext,
  projectPath: string,
  currentFileName: string,
  scriptData?: Partial<GameScript>,
): Promise<string | null> {
  return renameContentFile(
    ctx.dialogs, 'script', projectPath, currentFileName, scriptData);
}
