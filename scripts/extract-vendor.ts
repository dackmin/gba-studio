import { createHash } from 'node:crypto';
import fsp from 'node:fs/promises';
import path from 'node:path';

import * as tar from 'tar';

const [vendorName, customVendorPath] = process.argv.slice(2);
const targetPath = path.join('./public/vendors', vendorName);
const platform = process.platform;
const executableSuffix = platform === 'win32' ? '.exe' : '';

const vendorPaths: Record<string, Record<string, string>> = {
  devkitPro: {
    darwin: '/opt/devkitpro',
    win32: 'C:\\devkitPro',
    linux: '/opt/devkitpro',
  },
  python: {
    darwin: 'node_modules/@bjia56/portable-python-3.13/python-headless-3.13.9-darwin-universal2',
    win32: 'node_modules/@bjia56/portable-python-3.13/python-headless-3.13.9-windows-x86_64',
    linux: 'node_modules/@bjia56/portable-python-3.13/python-headless-3.13.9-linux-x86_64',
  },
};

const vendorFiles: Record<string, string[]> = {
  devkitPro: [
    `tools/bin/gbafix${executableSuffix}`,
    `tools/bin/grit${executableSuffix}`,
    'devkitARM/base_rules',
    'devkitARM/base_tools',
    'devkitARM/gba_rules',
    'devkitARM/arm-none-eabi/include',
    'devkitARM/arm-none-eabi/lib',
    'devkitARM/arm-none-eabi/bin',
    `devkitARM/bin/arm-none-eabi-g++${executableSuffix}`,
    `devkitARM/bin/arm-none-eabi-gcc${executableSuffix}`,
    `devkitARM/bin/arm-none-eabi-objcopy${executableSuffix}`,
    'devkitARM/lib/bfd-plugins',
    'devkitARM/lib/gcc',
    'devkitARM/include',
    `devkitARM/libexec/gcc/arm-none-eabi/16.1.0/cc1${executableSuffix}`,
    `devkitARM/libexec/gcc/arm-none-eabi/16.1.0/cc1plus${executableSuffix}`,
    'devkitARM/libexec/gcc/arm-none-eabi/16.1.0/liblto_plugin.so',
    'devkitARM/libexec/gcc/arm-none-eabi/16.1.0/liblto_plugin-0.dll',
    'devkitARM/libexec/gcc/arm-none-eabi/16.1.0/liblto_plugin.la',
  ],
  python: [
    'bin',
    'include',
    'lib',
    'share',
  ],
};

const vendorPath = customVendorPath || vendorPaths[vendorName][platform];
const files = vendorFiles[vendorName];

if (!files) {
  console.error(`Unknown vendor: ${vendorName}`);
  process.exit(1);
}

(async () => {
  // Vendor files array contains all files (unix & windows), so we have to filter
  // per platform (because tar does not ignore non-existing files, it just fails)
  const existingFiles: string[] = [];

  for (const file of files) {
    try {
      await fsp.access(path.join(vendorPath, file));
      existingFiles.push(file);
    } catch {}
  }

  await tar.create({
    gzip: true,
    file: path.join(targetPath, `${platform}.tar.gz`),
    cwd: vendorPath,
  }, existingFiles);

  const shasum = createHash('sha256')
    .update(await fsp.readFile(path.join(targetPath, `${platform}.tar.gz`)))
    .digest('hex');

  // eslint-disable-next-line no-console
  console.log(shasum);
})();
