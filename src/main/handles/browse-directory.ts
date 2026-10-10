import path from 'node:path';

import type { HostContext } from '../../types';

export default async (ctx: HostContext, opts?: {
  prefix?: string;
  suffix?: string;
}) => {
  const directory = await ctx.dialogs.openDirectory();

  if (!directory) {
    return '';
  }

  return path.join(opts?.prefix || '', directory, opts?.suffix || '');
};
