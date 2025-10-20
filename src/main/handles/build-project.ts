import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';

import type { IpcMainInvokeEvent } from 'electron';
import { simpleGit } from 'simple-git';

import type { Build } from '../../types';

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

async function buildProject (event: IpcMainInvokeEvent, build: Build) {
  if (build.controller.signal.aborted) {
    return;
  }

  sendStep(event, build.id, 'Building project...');

  const process = spawn('npm', ['run', 'build'], {
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
}

async function startBuild (event: IpcMainInvokeEvent, build: Build) {
  await checkButano(event, build);
  await buildProject(event, build);

  event.sender.send('build-completed', build.id);
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
