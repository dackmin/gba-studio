import path from 'node:path';

import type { FileFilter, HostContext } from '../../types';

export default async (ctx: HostContext, opts?: {
  prefix?: string;
  projectPath?: string;
  filters?: FileFilter[];
}) => {
  const file = await ctx.dialogs.openFile({
    filters: opts?.filters || [],
    defaultPath: opts?.projectPath ? path.basename(opts?.projectPath || '') : undefined,
  });

  if (!file) {
    return '';
  }

  return path.join(opts?.prefix || '', file);
};
