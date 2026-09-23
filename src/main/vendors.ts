import { createHash } from 'node:crypto';
import path from 'node:path';
import fsp from 'node:fs/promises';

import * as tar from 'tar';

import type { Build, ProjectConfiguration } from '../types';
import { runCommand } from './handles/build-project/utils';
import { getResourcesDir } from './utils';

const packagesShasum: Record<string, Record<string, string>> = {
  devkitPro: {
    darwin: '7e1398acc0b42ceb63ce9ac84084985c2c23495acd4b14206fb04b5a548e6a0d',
    win32: '5d90ee9fe12a2582a2388668f3f607dac8cd1fc85d25055e0135ebe7ef0218a2',
    linux: '8ffb33ae1e89f1f4fda5031974827180bf63a2ad4c01b3fcb009361cae74edb9',
  },
  python: {
    darwin: '7c51858fe6efebf9534fd9001fe6bc3ee7bef34234d5ab363b6f88fb963b9aed',
    win32: '1844cf69c5604c3b1fdbb8c9a0b59d3c68bddda29cd502524d43c7530546b882',
    linux: '71b44294295b7b32370f80a1246d3a8160caf18f28a1886be1bb747ba45acc46',
  },
};

async function getFileHash (buffer: Buffer) {
  return createHash('sha256')
    .update(buffer)
    .digest('hex');
}

export function getBuildConfiguration (
  build: Build,
): Partial<ProjectConfiguration> | undefined {
  const confName = build.configurationName || 'default';

  if (confName === 'default') {
    return { settings: build?.data?.project?.settings };
  }

  return build?.data?.project?.configurations?.find(conf =>
    conf.id === confName
  );
}

export function getCustomPythonPath (
  build: Build,
) {
  const buildConfig = getBuildConfiguration(build);

  return buildConfig?.settings?.pythonPath;
}

export function getCustomDevkitProPath (
  build: Build,
) {
  const buildConfig = getBuildConfiguration(build);

  return buildConfig?.settings?.devkitProPath;
}

async function uncompressFile (filePath: string, destPath: string) {
  await fsp.mkdir(destPath, { recursive: true });
  await tar.extract({
    file: filePath,
    cwd: destPath,
  });
}

async function downloadPackagedVendor (vendorName: string, platform: string) {
  const response = await fetch(
    `https://github.com/dackmin/gba-studio/raw/refs/heads/main/public/` +
      `/vendors/${vendorName}/${platform}.tar.gz`,
  );

  if (!response.ok) {
    throw new Error(`Failed to download zip: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const fileHash = await getFileHash(buffer);

  if (fileHash !== packagesShasum[vendorName][platform]) {
    throw new Error(`Hash mismatch for downloaded ${vendorName} package`);
  }

  await fsp.writeFile(
    path.join(getResourcesDir(), `./public/vendors/${vendorName}/${platform}.tar.gz`),
    buffer
  );
}

async function checkPackagedVendor (
  vendorName: string,
  build: Build,
) {
  if (build.controller?.signal.aborted) {
    return;
  }

  build.events.onLog(`Checking ${vendorName}...`);

  const vendorPath = getVendorPath(vendorName);

  // First try to use the vendor/platform directory directly
  try {
    await fsp.access(vendorPath);
  } catch {
    // If that fails, try to use the internal zip file
    try {
      await fsp.access(vendorPath + '.tar.gz');
      build.events.onLog(`${vendorName} not setup, extracting from archive...`);
      await uncompressFile(vendorPath + '.tar.gz', vendorPath);
      build.events.onSuccess(`${vendorName} extracted successfully.`);
    } catch {
      // If that fails, try to download archive from github
      try {
        await fsp.unlink(vendorPath + '.tar.gz').catch(() => {});
        build.events.onLog(`${vendorName} package not found, downloading from GitHub...`);
        await downloadPackagedVendor(vendorName, process.platform);
        build.events.onLog(`extracting ${vendorName} from downloaded archive...`);
        await uncompressFile(vendorPath + '.tar.gz', vendorPath);
      } catch (e) {
        build.events.onError(`${vendorName} not found`);
        build.events.onError((e as Error).message);
        build.controller?.abort();
        build.events.onAbort();
      }
    }
  }
}

export function getVendorPath (vendorName: string) {
  switch (process.platform) {
    case 'win32':
    case 'darwin':
      return path.join(
        getResourcesDir(),
        `./public/vendors/${vendorName}/${process.platform}`
      );
    default:
      return '/opt/devkitpro';
  }
}

async function checkPython (
  build: Build,
) {
  if (build.controller?.signal.aborted) {
    return;
  }

  const command = getCustomPythonPath(build) ||
    path.join(getVendorPath('python'), 'bin', 'python3') +
    (process.platform === 'win32' ? '.exe' : '');

  const version = await runCommand(command, ['--version'], {
    cwd: path.dirname(build.projectPath),
    build,
    log: false,
  });

  build.events.onSuccess(version.trim() + ' found');
}

async function checkDevkitPro (
  build: Build,
) {
  if (build.controller?.signal.aborted) {
    return;
  }

  const command = (getCustomDevkitProPath(build) ||
    getVendorPath('devkitPro')) + '/devkitARM/bin/arm-none-eabi-g++' +
    (process.platform === 'win32' ? '.exe' : '');

  const version = await runCommand(command, ['--version'], {
    cwd: path.dirname(build.projectPath),
    build,
    log: false,
  });

  build.events.onSuccess(version.trim().split('\n')[0] + ' found');
}

export async function checkDependencies (
  build: Build,
) {
  if (build.controller?.signal.aborted) {
    return;
  }

  build.events.onStep('Checking project dependencies...');

  const customPythonPath = getCustomPythonPath(build);

  if (!customPythonPath) {
    await checkPackagedVendor('python', build);
  } else {
    build.events.onLog('Checking Python...');
  }

  await checkPython(build);

  const customDevkitProPath = getCustomDevkitProPath(build);

  if (!customDevkitProPath) {
    await checkPackagedVendor('devkitPro', build);
  } else {
    build.events.onLog('Checking devkitPro...');
  }

  await checkDevkitPro(build);
}
