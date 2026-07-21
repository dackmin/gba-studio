import path from 'node:path';

import fse from 'fs-extra';

import pkg from '../package.json' with { type: 'json' };

function getVendorsPath (buildPath: string, platform: string) {
  switch (platform) {
    case 'darwin':
    case 'mas':
      return path.join(buildPath,
        pkg.executableName + '.app/Contents/Resources/public/vendors');
    case 'win32':
      return path.join(buildPath, 'resources/public/vendors');
    case 'linux':
      return path.join(buildPath, 'public/vendors');
    default:
      return buildPath;
  }
}

const removeButano = async (vendorsPath: string) => {
  const toDelete = [
    'butano/common',
    'butano/credits',
    'butano/docs',
    'butano/docs_tools',
    'butano/examples',
    'butano/games',
    'butano/issues',
    'butano/template',
    'butano/tests',
    'butano/.gitignore',
    'butano/README.md',
  ];

  for (const dir of toDelete) {
    try {
      await fse.remove(path.join(vendorsPath, dir));
    } catch {}
  }
};

const removePackagedVendor = async (vendorPath: string, platform: string) => {
  const files = await fse.readdir(vendorPath, { withFileTypes: true });

  // Remove unzipped development folders just in case
  for (const file of files) {
    if (file.isDirectory()) {
      const filePath = path.join(vendorPath, file.name);
      await fse.remove(filePath);
    }
  }

  // Remove all zips but the one for the current platform
  for (const file of files) {
    if (file.isFile() && file.name.endsWith('.zip')) {
      const filePath = path.join(vendorPath, file.name);

      if (!file.name.startsWith(platform)) {
        await fse.remove(filePath);
      }
    }
  }
};

export default async function removeVendorsPlugin (
  buildPath: string,
  _electronVersion: string,
  platform: string,
  _arch: string,
  next: (err: Error | null) => void
) {
  const vendorsPath = getVendorsPath(buildPath, platform);

  // Butano
  await removeButano(vendorsPath);
  await removePackagedVendor(path.join(vendorsPath, 'devkitPro'), platform);
  await removePackagedVendor(path.join(vendorsPath, 'python'), platform);

  next(null);
}
