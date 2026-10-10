import path from 'node:path';

import type { HostContext } from '../../types';

export default async (
  ctx: HostContext,
  projectPath: string,
  filePath: string
) => {
  const projectParent = path.dirname(projectPath);

  await ctx.shell.showItemInFolder(filePath.startsWith('project://')
    ? path.join(projectParent, filePath.replace('project://', ''))
    : filePath);
};
