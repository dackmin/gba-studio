import type { HostContext } from '../../types';

export default async (ctx: HostContext) => {
  return ctx.dialogs.confirmUnsavedChanges();
};
