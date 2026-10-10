import type { HostContext } from '../../types';

export default async (ctx: HostContext) => {
  await ctx.window.cancelQuit();
};
