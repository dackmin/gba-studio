import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';

import type { IpcMainInvokeEvent } from 'electron';
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

function runCommand (
  command: string,
  args: string[],
  opts?: {
    cwd?: string;
    event?: IpcMainInvokeEvent;
    build?: Build;
  }
) {
  return new Promise<string>((resolve, reject) => {
    const process = spawn(command, args, {
      cwd: opts?.cwd,
      stdio: 'pipe',
    });

    let res = '';
    let line = '';

    process.stdout?.on('data', data => {
      res += data.toString();
      line += data.toString();

      if (opts?.event && opts?.build && line.includes('\n')) {
        sendLog(opts.event, opts.build.id, line.trim());
        line = '';
      }
    });

    process.stderr?.on('data', data => {
      if (opts?.event && opts?.build) {
        sendError(opts.event, opts.build.id, data.toString());
      }
    });

    opts?.build?.controller.signal.addEventListener('abort', () => {
      process.kill();
      reject(new Error(`${command} process aborted`));
    });

    process.on('close', code => {
      if (code === 0) {
        resolve(res);
      } else {
        reject(new Error(`${command} process exited with code ${code}`));
      }
    });
  });
}

async function checkButano (event: IpcMainInvokeEvent, build: Build) {
  if (build.controller.signal.aborted) {
    return;
  }

  sendStep(event, build.id, 'Checking Butano submodule...');
  sendLog(event, build.id, 'Verifying Butano submodule status...');

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check if Butano submodule is initialized
  const submodules = await runCommand('git', ['submodule', 'status'], {
    cwd: path.dirname(build.projectPath),
    event,
    build,
  });

  if (submodules.includes('butano')) {
    sendLog(event, build.id, 'Butano submodule is up-to-date, skipping');

    return;
  }

  sendStep(event, build.id, 'Butano submodule not found, initializing...');

  // Initialize Butano submodule
  await runCommand('git', ['submodule', 'update', '--init', 'butano'], {
    cwd: path.dirname(build.projectPath),
    event,
    build,
  });

  sendLog(event, build.id, 'Butano submodule initialized');
}

async function checkJsDependencies (event: IpcMainInvokeEvent, build: Build) {
  if (build.controller.signal.aborted) {
    return;
  }

  sendStep(event, build.id, 'Checking project dependencies...');

  await runCommand('yarn', ['install'], {
    cwd: path.dirname(build.projectPath),
    event,
    build,
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
  await runCommand('make', [], {
    cwd: path.dirname(build.projectPath),
    event,
    build,
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
