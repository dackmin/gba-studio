import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import * as tar from 'tar';

const [vendorName, customVendorPath] = process.argv.slice(2);
const targetPath = path.join('./public/vendors', vendorName);
const platform = process.platform;

const vendorPaths: Record<string, Record<string, string>> = {
  devkitPro: {
    darwin: '/opt/devkitpro',
    win32: 'C:\\devkitPro',
    linux: '/opt/devkitpro',
  },
  python: {
    darwin: 'node_modules/@bjia56/portable-python-3.13/python-headless-3.13.9-darwin-universal2',
    win32: 'node_modules/@bjia56/portable-python-3.13/python-headless-3.13.9-win64',
    linux: 'node_modules/@bjia56/portable-python-3.13/python-headless-3.13.9-linux-x86_64',
  },
};

const vendorFiles: Record<string, string[]> = {
  devkitPro: [
    'tools/bin/gbafix',
    'tools/bin/grit',
    'devkitARM/base_rules',
    'devkitARM/base_tools',
    'devkitARM/gba_rules',
    'devkitARM/arm-none-eabi/include',
    'devkitARM/arm-none-eabi/lib',
    'devkitARM/arm-none-eabi/bin',
    'devkitARM/bin/arm-none-eabi-g++',
    'devkitARM/bin/arm-none-eabi-gcc',
    'devkitARM/bin/arm-none-eabi-objcopy',
    'devkitARM/lib/bfd-plugins',
    'devkitARM/lib/gcc',
    'devkitARM/include',
    'devkitARM/libexec/gcc/arm-none-eabi/16.1.0/cc1',
    'devkitARM/libexec/gcc/arm-none-eabi/16.1.0/cc1plus',
    'devkitARM/libexec/gcc/arm-none-eabi/16.1.0/liblto_plugin.so',
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
  await tar.create({
    gzip: true,
    file: path.join(targetPath, `${platform}.tar.gz`),
    cwd: vendorPath,
  }, files);

  const shasum = createHash('sha256')
    .update(readFileSync(path.join(targetPath, `${platform}.tar.gz`)))
    .digest('hex');

  // eslint-disable-next-line no-console
  console.log(shasum);
})();
