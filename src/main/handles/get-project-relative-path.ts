import path from 'node:path';

import type { HostContext } from '../../types';

export default async function (
  _: HostContext,
  projectPath: string,
  filePath: string,
) {
  if (!projectPath || !filePath) {
    return '';
  }

  return path.relative(path.dirname(projectPath), filePath);
}
