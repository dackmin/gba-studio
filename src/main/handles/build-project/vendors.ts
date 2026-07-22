import { createHash } from 'node:crypto';
import path from 'node:path';
import fsp from 'node:fs/promises';

import { IpcMainInvokeEvent } from 'electron';
import * as tar from 'tar';

import type { Build } from '../../../types';
import type Storage from '../../storage';
import { runCommand, sendStep, sendSuccessLog, sendLog, sendError, sendAbort } from './utils';
import { getResourcesDir } from '../../utils';

const packagesShasum: Record<string, Record<string, string>> = {
  devkitPro: {
    darwin: '90d662e6175e13e4ab17a39ac11fd86e3fd93428cfa385b15aa107f6f79f1226',
    win32: '2a55f51e5c06b259eadf71fb96d4362aceebc4ee7eb96322de361e0fca85a821',
    linux: '8ffb33ae1e89f1f4fda5031974827180bf63a2ad4c01b3fcb009361cae74edb9',
  },
  python: {
    darwin: '9654ba93c99e302e11c86bf0c1527fb7b76f664e87f9cf0ab931399e3db5753a',
    win32: 'TODO',
    linux: 'TODO',
  },
};

async function getFileHash (buffer: Buffer) {
  return createHash('sha256')
    .update(buffer)
    .digest('hex');
}

export function getBuildConfiguration (
  storage: Storage,
  build: Build,
) {
  const confName = storage.config?.buildConfiguration || 'default';

  if (confName === 'default') {
    return build?.data?.project?.settings;
  }

  return build?.data?.project?.configurations?.find(conf =>
    conf.id === confName
  )?.settings;
}

export function getCustomPythonPath (
  storage: Storage,
  build: Build,
) {
  const projectSettings = getBuildConfiguration(storage, build);

  return projectSettings?.pythonPath;
}

export function getCustomDevkitProPath (
  storage: Storage,
  build: Build,
) {
  const projectSettings = getBuildConfiguration(storage, build);

  return projectSettings?.devkitProPath;
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
    `https://github.com/dackmin/gba-studio/raw/refs/heads/feature/portable-build/public/` +
      `/vendors/${vendorName}/${platform}.tar.gz`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/zip',
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to download zip: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  // Verify the downloaded file's hash
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
  event: IpcMainInvokeEvent,
  build: Build,
) {
  if (build.controller?.signal.aborted) {
    return;
  }

  sendLog(event, build.id, `Checking ${vendorName}...`);

  const vendorPath = getVendorPath(vendorName);

  // First try to use the vendor/platform directory directly
  try {
    await fsp.access(vendorPath);
  } catch {
    // If that fails, try to use the internal zip file
    try {
      await fsp.access(vendorPath + '.tar.gz');
      sendLog(event, build.id, `${vendorName} not setup, extracting from archive...`);
      await uncompressFile(vendorPath + '.tar.gz', vendorPath);
      sendSuccessLog(event, build.id, `${vendorName} extracted successfully.`);
    } catch {
      // If that fails, try to download archive from github
      try {
        sendLog(event, build.id, `${vendorName} package not found, downloading from GitHub...`);
        await downloadPackagedVendor(vendorName, process.platform);
        sendLog(event, build.id, `extracting ${vendorName} from downloaded archive...`);
        await uncompressFile(vendorPath + '.tar.gz', vendorPath);
      } catch (e) {
        sendError(event, build.id, `${vendorName} not found`);
        sendError(event, build.id, (e as Error).message);
        build.controller?.abort();
        sendAbort(event, build.id);
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
  storage: Storage,
  event: IpcMainInvokeEvent,
  build: Build,
) {
  if (build.controller?.signal.aborted) {
    return;
  }

  const command = getCustomPythonPath(storage, build) ||
    path.join(getVendorPath('python'), 'bin', 'python3');

  const version = await runCommand(command, ['--version'], {
    cwd: path.dirname(build.projectPath),
    event,
    build,
    log: false,
  });

  sendSuccessLog(event, build.id, version.trim() + ' found');
}

async function checkDevkitPro (
  storage: Storage,
  event: IpcMainInvokeEvent,
  build: Build,
) {
  if (build.controller?.signal.aborted) {
    return;
  }

  const command = (getCustomDevkitProPath(storage, build) ||
    getVendorPath('devkitPro')) + '/devkitARM/bin/arm-none-eabi-g++';

  const version = await runCommand(command, ['--version'], {
    cwd: path.dirname(build.projectPath),
    event,
    build,
    log: false,
  });

  sendSuccessLog(event, build.id, version.trim().split('\n')[0] + ' found');
}

export async function checkDependencies (
  storage: Storage,
  event: IpcMainInvokeEvent,
  build: Build,
) {
  if (build.controller?.signal.aborted) {
    return;
  }

  sendStep(event, build.id, 'Checking project dependencies...');

  const customPythonPath = getCustomPythonPath(storage, build);

  if (!customPythonPath) {
    await checkPackagedVendor('python', event, build);
  } else {
    sendLog(event, build.id, 'Checking Python...');
  }

  await checkPython(storage, event, build);

  const customDevkitProPath = getCustomDevkitProPath(storage, build);

  if (!customDevkitProPath) {
    await checkPackagedVendor('devkitPro', event, build);
  } else {
    sendLog(event, build.id, 'Checking devkitPro...');
  }

  await checkDevkitPro(storage, event, build);
}
