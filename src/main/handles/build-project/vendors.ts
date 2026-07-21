import { createHash } from 'node:crypto';
import path from 'node:path';
import fsp from 'node:fs/promises';

import { IpcMainInvokeEvent } from 'electron';
import extractZip from 'extract-zip';

import type { Build } from '../../../types';
import type Storage from '../../storage';
import { runCommand, sendStep, sendSuccessLog, sendLog, sendError, sendAbort } from './utils';
import { getResourcesDir } from '../../utils';

const packagesShasum: Record<string, Record<string, string>> = {
  devkitPro: {
    darwin: '9657875b8135cd18da8baa9f374a0880d653c51c6777c7f9451c400774368fdc',
    win32: '75901e599d064e716eef67551471cb708ca8ed52e378264c574a1a683f14518b',
    linux: '3be7abd1c3855f9485aaa024763e4a1ee411747d13909ee18c7d0dca2b9567cf',
  },
  python: {
    darwin: '28836032813f1a969baf67ef503a8c855083a548474242b9bb85f61d808e1ada',
    win32: '28e9742888a944f362807cd2df3b8edeeef35b9b4dfa7da5e32e6f86e6962c94',
    linux: '26e12b9bf7b312865c801c86b9112dc7cb9634fce2d023d80ba36a0c38e237fc',
  },
};

async function getFileHash (buffer: Buffer) {
  const hash = createHash('sha256');
  hash.update(buffer);

  return hash.digest('hex');
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

function getCustomPythonPath (
  storage: Storage,
  build: Build,
) {
  const projectSettings = getBuildConfiguration(storage, build);

  return projectSettings?.pythonPath;
}

function getCustomDevkitProPath (
  storage: Storage,
  build: Build,
) {
  const projectSettings = getBuildConfiguration(storage, build);

  return projectSettings?.devkitProPath;
}

async function unzipFile (zipPath: string, destPath: string) {
  await extractZip(zipPath, { dir: destPath });
}

async function downloadPackagedVendor (vendorName: string, platform: string) {
  const response = await fetch(
    `https://github.com/dackmin/gba-studio/raw/refs/heads/feature/portable-build/public/` +
      `/vendors/${vendorName}/${platform}.zip`,
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
    path.join(getResourcesDir(), `./public/vendors/${vendorName}/${platform}.zip`),
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
      await fsp.access(vendorPath + '.zip');
      sendLog(event, build.id, `${vendorName} not setup, extracting from zip...`);
      await unzipFile(vendorPath + '.zip', vendorPath);
      sendSuccessLog(event, build.id, `${vendorName} extracted successfully.`);
    } catch {
      // If that fails, try to download the zip from github
      try {
        sendLog(event, build.id, `${vendorName} package not found, downloading from CDN...`);
        await downloadPackagedVendor(vendorName, process.platform);
        sendLog(event, build.id, `${vendorName} -> extracting from zip...`);
        await unzipFile(vendorPath + '.zip', vendorPath);
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

  const command = getCustomDevkitProPath(storage, build) ||
    getVendorPath('devkitPro') + '/devkitARM/bin/arm-none-eabi-g++';

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
