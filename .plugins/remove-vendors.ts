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

const removePackagedVendor = async (vendorPath: string) => {
  const toDelete = [
    'darwin.tar.gz',
    'darwin.zip',
    'darwin',
    'linux.tar.gz',
    'linux.zip',
    'linux',
    'win32.tar.gz',
    'win32.zip',
    'win32',
  ];

  for (const file of toDelete) {
    try {
      await fse.remove(path.join(vendorPath, file));
    } catch {}
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
  await removePackagedVendor(path.join(vendorsPath, 'devkitPro'));
  await removePackagedVendor(path.join(vendorsPath, 'python'));

  next(null);
}
