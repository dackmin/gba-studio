import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';

import type { IpcMainInvokeEvent } from 'electron';
import extractZip from 'extract-zip';
import fse from 'fs-extra';

import type { AppPayload, Build, BuildOptions } from '../../../types';
import { getResourcesDir } from '../../utils';
import {
  getBuildDir,
  runCommand,
  sendAbort,
  sendError,
  sendLog,
  sendStep,
  sendSuccessLog,
} from './utils';
import { buildTemplates, compileTemplate } from './templates';
import { serialize } from '../../serialize';
import { sanitize } from '../../sanitize';
import Storage from '../../storage';

const builds = new Map<string, Build>();
let latestBuildId: string | null = null;

function getBuildConfiguration (
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

  try {
    await fs.access(vendorPath);
  } catch {
    try {
      await fs.access(vendorPath + '.zip');
      sendLog(event, build.id, `${vendorName} not setup, extracting from zip...`);
      await unzipFile(
        vendorPath + '.zip',
        vendorPath
      );

      sendSuccessLog(event, build.id, `${vendorName} extracted successfully.`);
    } catch (e) {
      sendError(event, build.id, `${vendorName} not found`);
      sendError(event, build.id, (e as Error).message);
      build.controller?.abort();
      sendAbort(event, build.id);
    }
  }
}

function getVendorPath (vendorName: string) {
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
    getVendorPath('python') + '/bin/python3';

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

async function checkDependencies (
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

async function buildMakefile (
  _storage: Storage,
  build: Build,
) {
  const target = path
    .basename(build.projectPath, path.extname(build.projectPath));
  const makefileContent = await compileTemplate(
    await fse.readFile(path.join(
      getResourcesDir(),
      './public/templates/commons/templates',
      'Makefile.tpl'
    ), 'utf-8'),
    {
      target,
      pythonPath: path.join(getVendorPath('python'), 'bin', 'python3'),
      devkitProPath: getVendorPath('devkitPro'),
      butanoPath: path.join(
        getResourcesDir(),
        './public/vendors/butano/butano'
      ),
      sources: [
        path.relative(
          getBuildDir(build),
          path.join(path.dirname(build.projectPath), 'src'),
        ),
        path.relative(
          getBuildDir(build),
          path.join(getResourcesDir(), './public/templates/commons/src'),
        ),
      ],
      includes: [
        path.relative(
          getBuildDir(build),
          path.join(path.dirname(build.projectPath), 'include'),
        ),
        path.relative(
          getBuildDir(build),
          path.join(getResourcesDir(), './public/templates/commons/include'),
        ),
      ],
      graphics: [
        path.relative(
          getBuildDir(build),
          path.join(path.dirname(build.projectPath), 'graphics'),
        ),
        path.relative(
          getBuildDir(build),
          path.join(getResourcesDir(), './public/templates/commons/graphics'),
        ),
      ],
      audio: [
        path.relative(
          getBuildDir(build),
          path.join(path.dirname(build.projectPath), 'audio'),
        ),
        path.relative(
          getBuildDir(build),
          path.join(getResourcesDir(), './public/templates/commons/audio'),
        ),
      ],
      romTitle: build.data?.project?.romName || 'My Game',
      romCode: build.data?.project?.romCode || 'ABCD',
    }
  );

  await fse.outputFile(
    path.join(getBuildDir(build), 'Makefile'),
    makefileContent,
    'utf-8'
  );
}

async function buildProject (
  storage: Storage,
  event: IpcMainInvokeEvent,
  build: Build,
) {
  if (build.controller?.signal.aborted) {
    return;
  }

  const start = globalThis.performance.now();

  if (build.opts?.clean === true) {
    sendStep(event, build.id, 'Cleaning build folder...');
    await fse.remove(getBuildDir(build));
    sendSuccessLog(event, build.id, 'Build folder cleaned.');
  }

  sendStep(event, build.id, 'Pre-building templates...');
  await buildTemplates(event, build);

  sendStep(event, build.id, 'Building project...');
  sendLog(event, build.id, `Building project in ${getBuildDir(build)}...`);

  const target = path
    .basename(build.projectPath, path.extname(build.projectPath));

  await buildMakefile(storage, build);

  const cores = os.cpus()?.length || 1;

  if (cores > 1) {
    sendLog(event, build.id,
      `🚀 ${cores} CPU cores detected, enabling multi-core build`);
  }

  // Run make
  await runCommand('make', [
    ...cores > 1 ? [`-j${cores.toString()}`] : [],
  ], {
    cwd: getBuildDir(build),
    event,
    build,
  });

  const finalGamePath = path.join(
    path.dirname(build.projectPath),
    'out',
    target + '.gba'
  );

  // Copy built .gba to project directory
  await fse.ensureDir(path.dirname(finalGamePath));
  await fse.copyFile(
    path.join(getBuildDir(build), target + '.gba'),
    finalGamePath,
  );

  sendSuccessLog(event, build.id,
    `Project built successfully in ` +
    `${(globalThis.performance.now() - start).toFixed(2)} ms 🎉`
  );

  // Check for built .gba file
  try {
    await fs.access(finalGamePath);
  } catch (e) {
    sendError(event, build.id, `Built .gba file not found: ${finalGamePath}`);
    sendError(event, build.id, (e as Error).message);
    build.controller?.abort();
    sendAbort(event, build.id);
  }

  const projectSettings = getBuildConfiguration(storage, build);

  if (projectSettings?.emulatorType === 'external') {
    const [command, ...args] = (
      projectSettings?.emulatorCommand || 'open -a mGBA'
    ).split(
      // Take spaces in folders into account
      /\s+(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/gm
    );

    const runner = spawn(command, [
      ...args,
      finalGamePath,
    ], { stdio: 'inherit', shell: true });

    runner.unref();
  }
}

async function startBuild (
  storage: Storage,
  event: IpcMainInvokeEvent,
  build: Build,
) {
  try {
    await checkDependencies(storage, event, build);

    if (build.controller?.signal.aborted) {
      return;
    }

    await buildProject(storage, event, build);

    event.sender.send('build-completed', build.id);
  } catch (e) {
    if (build.controller?.signal.aborted) {
      sendAbort(event, build.id);
    } else {
      sendError(event, build.id, (e as Error).message);
    }
  }
}

export async function startBuildProject (
  storage: Storage,
  event: IpcMainInvokeEvent,
  projectPath: string,
  data: Partial<AppPayload>,
  opts?: BuildOptions,
) {
  const buildId = randomUUID();
  latestBuildId = buildId;
  const controller = new AbortController();
  const build: Build = {
    id: buildId,
    projectPath,
    controller,
    data: await serialize(await sanitize(data, { projectPath })),
    opts,
  };

  builds.set(buildId, build);
  event.sender.send('build-started', { id: buildId });
  startBuild(storage, event, build);

  return buildId;
}

export function abortBuildProject (
  event: IpcMainInvokeEvent,
  buildId?: string
) {
  const controller = builds.get(buildId || latestBuildId || '')?.controller;

  if (controller) {
    controller.abort();
  }

  event.sender.send('build-aborted', { id: buildId });
}

export async function cleanBuildFolder (
  event: IpcMainInvokeEvent,
  projectPath: string,
) {
  const build: Build = {
    id: randomUUID(),
    projectPath,
  };

  sendStep(event, build.id, 'Cleaning build folder...');
  await fse.remove(getBuildDir(build));
  sendSuccessLog(event, build.id, 'Build folder cleaned.');
}

