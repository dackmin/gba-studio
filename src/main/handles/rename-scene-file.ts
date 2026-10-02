import path from 'node:path';
import fsp from 'node:fs/promises';
import { type IpcMainInvokeEvent, dialog } from 'electron';

import type { GameScene } from '../../types';
import { toFileSlug } from '../../helpers';

export default async function (
  _: IpcMainInvokeEvent,
  projectPath: string,
  currentFileName: string,
  sceneData?: Partial<GameScene>,
): Promise<string | null> {
  const projectDir = path.dirname(projectPath);
  const contentDir = path.join(projectDir, 'content');
  await fsp.mkdir(contentDir, { recursive: true });

  const defaultFileName = currentFileName?.endsWith('.json')
    ? currentFileName
    : `${currentFileName || 'scene_1'}.json`;

  const result = await dialog.showSaveDialog({
    title: 'Rename Scene File',
    defaultPath: path.join(contentDir, defaultFileName),
    filters: [{ name: 'JSON Scene file', extensions: ['json'] }],
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  const rawBaseName = path.basename(result.filePath, '.json');
  const slug = toFileSlug(rawBaseName.replace(/^scene_/, ''));
  const newFileName = `scene_${slug}.json`;

  const oldFilePath = path.join(contentDir, currentFileName);
  const newFilePath = path.join(contentDir, newFileName);

  if (oldFilePath !== newFilePath) {
    try {
      await fsp.access(oldFilePath);
      await fsp.rename(oldFilePath, newFilePath);
    } catch {
      if (sceneData) {
        const dataToSave = { ...sceneData };
        delete dataToSave._file;
        await fsp.writeFile(
          newFilePath,
          JSON.stringify(dataToSave, null, 2) + '\n',
          'utf-8',
        );
      }
    }
  }

  return newFileName;
}
