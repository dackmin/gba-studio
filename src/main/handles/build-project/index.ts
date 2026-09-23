import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';

import type { IpcMainInvokeEvent } from 'electron';
import fse from 'fs-extra';

import type { AppPayload, Build, BuildOptions } from '../../../types';
import { getResourcesDir } from '../../utils';
import {
  getBuildDir,
  humanSize,
  runCommand,
  sendAbort,
  sendError,
  sendLog,
  sendStep,
  sendSuccessLog,
} from './utils';
import { buildTemplates, compileTemplate } from './templates';
import {
  checkDependencies,
  getBuildConfiguration,
  getCustomDevkitProPath,
  getCustomPythonPath,
  getVendorPath,
} from '../../vendors';
import { prepareData } from './data';
import { serialize } from '../../serialize';
import { sanitize } from '../../sanitize';
import Storage from '../../storage';
import { copyAssets } from './assets';

const builds = new Map<string, Build>();
let latestBuildId: string | null = null;

function createHandlers (
  event: IpcMainInvokeEvent,
  buildId: string
): Build['events'] {
  return {
    onLog: (...args: any[]) => sendLog(event, buildId, args.join(' ')),
    onStep: (...args: any[]) => sendStep(event, buildId, args.join(' ')),
    onError: (...args: any[]) => sendError(event, buildId, args.join(' ')),
    onSuccess: (...args: any[]) => sendSuccessLog(event, buildId, args.join(' ')),
    onAbort: () => sendAbort(event, buildId),
    onStart: () => event.sender.send('build-started', { id: buildId }),
    onComplete: () => event.sender.send('build-completed', { id: buildId }),
  };
}

async function buildMakefile (
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
      pythonPath: getCustomPythonPath(build) ||
        path.join(getVendorPath('python'), 'bin', 'python3'),
      devkitProPath: getCustomDevkitProPath(build) ||
        getVendorPath('devkitPro'),
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
        './graphics',
        path.relative(
          getBuildDir(build),
          path.join(getResourcesDir(), './public/templates/commons/graphics'),
        ),
      ],
      audio: [
        './audio',
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

async function isFirstBuild (build: Build): Promise<boolean> {
  const buildDir = getBuildDir(build);

  try {
    await fs.access(path.join(buildDir, 'Makefile'));

    return false;
  } catch {
    return true;
  }
}

export async function buildProject (
  build: Build,
) {
  if (build.controller?.signal.aborted) {
    return;
  }

  const start = globalThis.performance.now();

  const buildConfig = getBuildConfiguration(build);

  if (buildConfig?.name) {
    build.events.onLog(`Build configuration: ${buildConfig?.name}`);
  }

  if (build.data?.project) {
    build.data.project.settings = buildConfig?.settings;
  }

  if (build.opts?.clean === true) {
    build.events.onStep('Cleaning build folder...');
    await fse.remove(getBuildDir(build));
    build.events.onSuccess('Build folder cleaned.');
  }

  const firstBuild = await isFirstBuild(build);

  build.events.onStep('Preparing assets...');
  build.events.onLog(`Copying assets...`);
  await copyAssets(build);
  build.events.onSuccess('Assets copied successfully.');

  build.events.onStep('Pre-building templates...');
  await buildTemplates(await prepareData(build));

  build.events.onStep('Building project...');
  build.events.onLog(`Building project in ${getBuildDir(build)}...`);

  const target = path
    .basename(build.projectPath, path.extname(build.projectPath));

  await buildMakefile(build);

  const cores = os.cpus()?.length || 1;

  if (cores > 1 && !firstBuild) {
    build.events.onLog(
      `🚀 ${cores} CPU cores detected, enabling multi-core build`);
  } else if (cores > 1 && firstBuild) {
    build.events.onLog(
      `ℹ️ Multiple CPU cores detected, but multi-core build disabled for first build ` +
        `(next builds will be faster)`);
  }

  // Run make
  await runCommand('make', [
    ...cores > 1 && !firstBuild ? [`-j${cores.toString()}`] : [],
  ], {
    cwd: getBuildDir(build),
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

  // Check for built .gba file
  try {
    await fs.access(finalGamePath);
  } catch (e) {
    build.events.onError(`Built .gba file not found: ${finalGamePath}`);
    build.events.onError((e as Error).message);
    build.controller?.abort();
    build.events.onAbort();
  }

  const romSize = (await fs.stat(finalGamePath)).size;

  build.events.onSuccess(
    `Project built successfully in ` +
    `${(globalThis.performance.now() - start).toFixed(2)} ms 🎉 ` +
    `(ROM size: ${humanSize(romSize)})`
  );

  if (buildConfig?.settings?.emulatorType === 'external') {
    const [command, ...args] = (
      buildConfig?.settings?.emulatorCommand || 'open -a mGBA'
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
  event: IpcMainInvokeEvent,
  build: Build,
) {
  try {
    await checkDependencies(build);

    if (build.controller?.signal.aborted) {
      return;
    }

    await buildProject(build);
    build.events.onComplete();
  } catch (e) {
    if (build.controller?.signal.aborted) {
      build.events.onAbort();
    } else {
      build.events.onError((e as Error).message);
      build.events.onAbort();
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
    configurationName: storage.config?.buildConfiguration,
    projectPath,
    controller,
    data: await serialize(await sanitize(data, { projectPath })),
    opts,
    events: createHandlers(event, buildId),
  };

  builds.set(buildId, build);
  build.events.onStart();
  startBuild(event, build);

  return buildId;
}

export function abortBuildProject (
  _: IpcMainInvokeEvent,
  buildId?: string
) {
  const controller = builds.get(buildId || latestBuildId || '')?.controller;

  if (controller) {
    controller.abort();
  }

  const build = builds.get(buildId || latestBuildId || '');
  build?.events.onAbort();
}

export async function cleanBuildFolder (
  event: IpcMainInvokeEvent,
  projectPath: string,
) {
  const buildId = randomUUID();
  const build: Build = {
    id: buildId,
    projectPath,
    events: createHandlers(event, buildId),
  };

  event.sender.send('clean-started', { id: build.id });
  sendStep(event, build.id, 'Cleaning build folder...');
  await fse.remove(getBuildDir(build));
  event.sender.send('clean-completed', { id: build.id });
  sendSuccessLog(event, build.id, 'Build folder cleaned.');
}

