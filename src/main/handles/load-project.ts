import type { AppPayload, HostContext } from '../../types';
import { loadProjectData } from '../project';
import Storage from '../storage';

export default async (
  storage: Storage,
  ctx: HostContext,
  projectPath: string
): Promise<Partial<AppPayload>> => {
  await ctx.window.setProgress(0);

  const data = await loadProjectData(projectPath, {
    onProgress: (current, total) => {
      ctx.window.setProgress(current / total);
    },
  });

  // Save project to recent projects
  storage.addToRecentProjects(projectPath, data.project!);
  await ctx.window.setProgress(1);

  // Reset progress
  await ctx.window.setProgress(-1);

  return data;
};
