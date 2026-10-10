import path from 'node:path';
import fs from 'node:fs/promises';

import type { HostContext } from '../../types';

export default async (ctx: HostContext) => {
  const selected = await ctx.dialogs.openProject();

  if (!selected) {
    return;
  }

  const stats = await fs.stat(selected);

  if (stats.isDirectory()) {
    const projectFile = await fs
      .readdir(selected)
      .then(files => files.find(file => file.endsWith('.gbasproj')));

    if (projectFile) {
      await ctx.window.openProject(path.join(selected, projectFile));
    }
  } else if (stats.isFile() && selected.endsWith('.gbasproj')) {
    await ctx.window.openProject(selected);
  }
};
