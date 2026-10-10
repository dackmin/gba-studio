import fsp from 'node:fs/promises';

import type { HostContext } from '../../types';

export default async (ctx: HostContext, projectPath: string) => {
  try {
    await fsp.access(projectPath);
  } catch {
    await ctx.dialogs.showError(
      'Project Not Found',
      `The project at "${projectPath}" could not be found.`
    );

    return;
  }

  await ctx.window.openProject(projectPath);
};
