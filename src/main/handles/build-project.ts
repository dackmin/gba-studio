import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';

import type { IpcMainInvokeEvent } from 'electron';
import { simpleGit } from 'simple-git';
import fse from 'fs-extra';

import type { Build } from '../../types';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const builds = new Map<string, Build>();
let latestBuildId: string | null = null;

function sendStep (
  event: IpcMainInvokeEvent,
  buildId: string,
  message: string
) {
  event.sender.send('build-step', {
    id: buildId,
    message,
  });
}

function sendLog (
  event: IpcMainInvokeEvent,
  buildId: string,
  message: string
) {
  event.sender.send('build-log', {
    id: buildId,
    message,
  });
}

function sendError (
  event: IpcMainInvokeEvent,
  buildId: string,
  message: string
) {
  event.sender.send('build-error', {
    id: buildId,
    message,
  });
}

function sendAbort (
  event: IpcMainInvokeEvent,
  buildId: string,
) {
  event.sender.send('build-aborted', {
    id: buildId,
  });
}

async function checkButano (event: IpcMainInvokeEvent, build: Build) {
  if (build.controller.signal.aborted) {
    return;
  }

  const git = simpleGit({
    baseDir: path.dirname(build.projectPath),
  });

  sendStep(event, build.id, 'Checking Butano submodule...');

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check if Butano submodule is initialized
  const submodules = await git.subModule(['status']);

  if (submodules.includes('butano')) {
    sendLog(event, build.id, 'Butano submodule is up-to-date');

    return;
  }

  sendStep(event, build.id, 'Butano submodule not found.');

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Initialize Butano submodule
  sendLog(event, build.id, await git.subModule(['update', '--init', 'butano']));

  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function checkJsDependencies (event: IpcMainInvokeEvent, build: Build) {
  if (build.controller.signal.aborted) {
    return;
  }

  sendStep(event, build.id, 'Checking project dependencies...');

  const process = spawn('yarn', ['install'], {
    cwd: path.dirname(build.projectPath),
    stdio: 'inherit',
  });

  process.stdout?.on('data', data => {
    sendLog(event, build.id, data.toString());
  });

  process.stderr?.on('data', data => {
    sendError(event, build.id, data.toString());
  });

  await new Promise<void>((resolve, reject) => {
    build.controller.signal.addEventListener('abort', () => {
      process.kill();
      reject(new Error('Dependency installation aborted'));
    });

    process.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Dependency installation exited with code ${code}`));
      }
    });
  });
}

async function checkTemplates (event: IpcMainInvokeEvent, build: Build) {
  if (build.controller.signal.aborted) {
    return;
  }

  sendStep(event, build.id, 'Updating project templates...');

  // Copy includes
  await fse.copy(
    path.join(__dirname, '../../public/templates/commons/include'),
    path.join(path.dirname(build.projectPath), 'include'),
    { overwrite: true, errorOnExist: false }
  );

  // Copy src
  await fse.copy(
    path.join(__dirname, '../../public/templates/commons/src'),
    path.join(path.dirname(build.projectPath), 'src'),
    { overwrite: true, errorOnExist: false }
  );

  // Copy templates
  await fse.copy(
    path.join(__dirname, '../../public/templates/commons/templates'),
    path.join(path.dirname(build.projectPath), 'templates'),
    { overwrite: true, errorOnExist: false }
  );

  // Copy scripts
  await fse.copy(
    path.join(__dirname, '../../public/templates/commons/scripts'),
    path.join(path.dirname(build.projectPath), 'scripts'),
    { overwrite: true, errorOnExist: false }
  );
}

async function buildProject (event: IpcMainInvokeEvent, build: Build) {
  if (build.controller.signal.aborted) {
    return;
  }

  sendStep(event, build.id, 'Building project...');

  const process = spawn('make', [], {
    cwd: path.dirname(build.projectPath),
    stdio: 'inherit',
  });

  process.stdout?.on('data', data => {
    sendLog(event, build.id, data.toString());
  });

  process.stderr?.on('data', data => {
    sendError(event, build.id, data.toString());
  });

  await new Promise<void>((resolve, reject) => {
    build.controller.signal.addEventListener('abort', () => {
      process.kill();
      reject(new Error('Build process aborted'));
    });

    process.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Build process exited with code ${code}`));
      }
    });
  });

  // Check for built .gba file
  const builtGbaPath = path.join(
    path.dirname(build.projectPath),
    path.basename(path.dirname(build.projectPath)) + '.gba'
  );

  try {
    await fs.access(builtGbaPath);
  } catch (e) {
    sendError(event, build.id, `Built .gba file not found: ${builtGbaPath}`);
    sendError(event, build.id, (e as Error).message);
    build.controller.abort();
    sendAbort(event, build.id);
  }

  const runner = spawn('open', [
    '-a', 'mGBA',
    builtGbaPath,
  ], {
    stdio: 'inherit',
  });
  runner.unref();
}

async function startBuild (event: IpcMainInvokeEvent, build: Build) {
  try {
    await checkButano(event, build);
    await checkJsDependencies(event, build);
    await checkTemplates(event, build);
    await buildProject(event, build);

    event.sender.send('build-completed', build.id);
  } catch (e) {
    if (build.controller.signal.aborted) {
      sendAbort(event, build.id);
    } else {
      sendError(event, build.id, (e as Error).message);
    }
  }
}

export function startBuildProject (
  event: IpcMainInvokeEvent,
  projectPath: string,
) {
  const buildId = randomUUID();
  latestBuildId = buildId;
  const controller = new AbortController();
  const build: Build = { id: buildId, projectPath, controller };

  builds.set(buildId, build);
  event.sender.send('build-started', { id: buildId });
  startBuild(event, build);

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
