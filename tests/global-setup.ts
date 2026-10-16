import path from 'node:path';

import fse from 'fs-extra';

import {
  downloadPackagedVendor,
  uncompressFile,
} from '../src/main/vendors';

const cacheDir = path.resolve('./node_modules/.cache/gba-studio/vendors');

const ensureVendor = async (name: string) => {
  if (
    !(await fse.exists(path.resolve(cacheDir, name))) ||
    await fse.emptyDir(path.resolve(cacheDir, name))
  ) {
    await downloadPackagedVendor(
      name,
      process.platform,
      path.resolve(cacheDir, `${name}.tar.gz`),
    );
    await uncompressFile(
      path.resolve(cacheDir, `${name}.tar.gz`),
      path.resolve(cacheDir, name)
    );
  }
};

export async function setup () {
  await fse.mkdir(cacheDir, { recursive: true });

  await ensureVendor('python');
  await ensureVendor('devkitPro');
}
