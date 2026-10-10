import path from 'node:path';

import type { HostContext } from '../../types';

export default function (_: HostContext, projectPath: string) {
  const romPath = path.join(
    'out',
    path.basename(projectPath, path.extname(projectPath)) + '.gba'
  );

  if (process.platform === 'win32') {
    return romPath.replace(/\\/g, '/');
  }

  return romPath;
}
