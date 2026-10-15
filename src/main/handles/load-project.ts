import fsp from 'node:fs/promises';

import { type IpcMainInvokeEvent, BrowserWindow } from 'electron';

import type { AppPayload } from '../../types';
import { getAutosavePath } from '../files';
import { loadProjectData } from '../project';
import { sanitize } from '../sanitize';
import { unserialize } from '../serialize';
import Storage from '../storage';

const loadAutosaveData = async (
  projectPath: string,
  diskSavedAt: number,
): Promise<Partial<AppPayload> | null> => {
  try {
    const raw = await fsp.readFile(getAutosavePath(projectPath), 'utf-8');
    const autosave = JSON.parse(raw);

    if (
      autosave?.$autosave !== true ||
      !autosave?.data ||
      autosave?.projectPath !== projectPath ||
      autosave?.savedAt <= diskSavedAt
    ) {
      return null;
    }

    return {
      ...await sanitize(
        await unserialize(autosave.data), { projectPath }
      ),
      _recoveredAutosave: true,
    };
  } catch {
    return null;
  }
};

export default async (
  storage: Storage,
  event: IpcMainInvokeEvent,
  projectPath: string
): Promise<Partial<AppPayload>> => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.setProgressBar(0);

  let diskSavedAt = 0;

  try {
    diskSavedAt = (await fsp.stat(projectPath)).mtimeMs;
  } catch {}

  const autosaveData = await loadAutosaveData(projectPath, diskSavedAt);

  if (autosaveData) {
    win?.setProgressBar(1);
    win?.setProgressBar(-1);

    return autosaveData;
  }

  const data = await loadProjectData(projectPath, {
    onProgress: (current, total) => {
      win?.setProgressBar(current / total);
    },
  });

  // Save project to recent projects
  storage.addToRecentProjects(projectPath, data.project!);
  win?.setProgressBar(1);

  // Reset progress
  win?.setProgressBar(-1);

  return data;
};
