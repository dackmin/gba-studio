import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';

import type { IpcMainInvokeEvent } from 'electron';
import fse from 'fs-extra';

import type { AppPayload, Build } from '../../../types';
import { getResourcesDir } from '../../utils';
import {
  runCommand,
  sendAbort,
  sendError,
  sendLog,
  sendStep,
  sendSuccessLog,
} from './utils';
import { buildTemplates } from './templates';

const builds = new Map<string, Build>();
let latestBuildId: string | null = null;

async function checkGit (event: IpcMainInvokeEvent, build: Build) {
  if (build.controller.signal.aborted) {
    return;
  }

  const projectSettings = build.data?.project?.settings;

  sendStep(event, build.id, 'Checking project configuration...');
  sendLog(event, build.id, 'Verifying Git repository...');

  try {
    await runCommand(projectSettings?.gitPath || 'git', ['status'], {
      cwd: path.dirname(build.projectPath),
      event,
      build,
      log: false,
      logErrors: false,
    });

    sendSuccessLog(event, build.id,
      'Git repository found, skipping initialization');
  } catch (e) {
    if ((e as Error).message.includes('not a git repository')) {
      sendStep(event, build.id, 'Initializing project...');
      sendLog(event, build.id, 'Initializing Git repository...');

      await runCommand(projectSettings?.gitPath || 'git', ['init'], {
        cwd: path.dirname(build.projectPath),
        event,
        build,
      });
    } else {
      throw e;
    }
  }
}

async function checkButano (event: IpcMainInvokeEvent, build: Build) {
  if (build.controller.signal.aborted) {
    return;
  }

  const projectSettings = build.data?.project?.settings;

  sendLog(event, build.id, 'Verifying Butano submodule status...');

  // Check if Butano submodule is initialized
  const submodules = await runCommand(
    projectSettings?.gitPath || 'git',
    ['submodule', 'status'],
    {
      cwd: path.dirname(build.projectPath),
      event,
      build,
    }
  );

  if (submodules.includes('butano')) {
    sendSuccessLog(event, build.id, 'Butano submodule is up-to-date, skipping');

    return;
  }

  // Initialize Butano submodule
  await runCommand(projectSettings?.gitPath || 'git', [
    'submodule', 'add', 'https://github.com/GValiente/butano.git',
  ], {
    cwd: path.dirname(build.projectPath),
    event,
    build,
  });

  sendSuccessLog(event, build.id, 'Butano submodule initialized');
}

async function checkPython (event: IpcMainInvokeEvent, build: Build) {
  if (build.controller.signal.aborted) {
    return;
  }

  const projectSettings = build.data?.project?.settings;

  sendLog(event, build.id, 'Checking Python path...');

  try {
    const pythonVersion = await runCommand(
      projectSettings?.pythonPath || 'python',
      ['--version'],
      {
        cwd: path.dirname(build.projectPath),
        event,
        build,
        logErrors: false,
      },
    );

    sendSuccessLog(event, build.id, 'Python found: ' + pythonVersion.trim());
  } catch {
    try {
      const python3Version = await runCommand(
        projectSettings?.pythonPath || 'python3',
        ['--version'],
        {
          cwd: path.dirname(build.projectPath),
          event,
          build,
          logErrors: false,
        },
      );

      if (!python3Version.startsWith('Python')) {
        throw new Error('Invalid python3 version output');
      }

      sendSuccessLog(event, build.id, 'Python found: ' + python3Version.trim());

      const envPath = path.join(
        path.dirname(build.projectPath),
        '.env'
      );

      let envContent = '';

      try {
        envContent = await fs.readFile(envPath, 'utf-8');
        sendLog(event, build.id, 'Existing .env file found, updating...');
      } catch {}

      if (!envContent.includes('PYTHON=')) {
        envContent += (envContent.length > 0 ? '\n' : '') + 'PYTHON=python3\n';
        await fs.writeFile(envPath, envContent, 'utf-8');
        sendSuccessLog(event, build.id, 'Updated .env file with python3 path');
      }
    } catch (e) {
      sendError(event, build.id, (e as Error).message);
      sendError(event, build.id,
        'Automatic python executable detection failed. Python is not ' +
        'installed or not found in PATH, please set the ' +
        'right command in your project\'s settings.');
      build.controller.abort();
      sendAbort(event, build.id);
    }
  }
}

async function checkDependencies (event: IpcMainInvokeEvent, build: Build) {
  if (build.controller.signal.aborted) {
    return;
  }

  sendStep(event, build.id, 'Checking project dependencies...');

  await checkButano(event, build);
  await checkPython(event, build);
}

async function checkTemplates (event: IpcMainInvokeEvent, build: Build) {
  if (build.controller.signal.aborted) {
    return;
  }

  sendStep(event, build.id, 'Updating project\'s core files...');
  sendLog(event, build.id, 'Updating core files from common template...');

  // Copy includes
  await fse.copy(
    path.join(getResourcesDir(), './public/templates/commons/include'),
    path.join(path.dirname(build.projectPath), 'include'),
    { overwrite: true, errorOnExist: false }
  );
  sendSuccessLog(event, build.id, 'include/ folder updated');

  // Copy src
  await fse.copy(
    path.join(getResourcesDir(), './public/templates/commons/src'),
    path.join(path.dirname(build.projectPath), 'src'),
    { overwrite: true, errorOnExist: false }
  );
  sendSuccessLog(event, build.id, 'src/ folder updated');

  // Copy templates
  await fse.copy(
    path.join(getResourcesDir(), './public/templates/commons/templates'),
    path.join(path.dirname(build.projectPath), 'templates'),
    { overwrite: true, errorOnExist: false }
  );
  sendSuccessLog(event, build.id, 'templates/ folder updated');

  // Copy graphics
  await fse.copy(
    path.join(getResourcesDir(), './public/templates/commons/graphics'),
    path.join(path.dirname(build.projectPath), 'graphics'),
    { overwrite: true, errorOnExist: false }
  );
  sendSuccessLog(event, build.id, 'graphics/ folder updated');
}

async function buildProject (event: IpcMainInvokeEvent, build: Build) {
  if (build.controller.signal.aborted) {
    return;
  }

  sendStep(event, build.id, 'Pre-building templates...');
  await buildTemplates(event, build);

  sendStep(event, build.id, 'Building project...');
  sendLog(event, build.id, 'Building using project\'s Makefile...');
  await runCommand('make', [], {
    cwd: path.dirname(build.projectPath),
    event,
    build,
  });

  sendSuccessLog(event, build.id, 'Project built successfully 🎉');

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
    await checkGit(event, build);
    await checkDependencies(event, build);
    await checkTemplates(event, build);

    if (build.controller.signal.aborted) {
      return;
    }

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
  data?: Partial<AppPayload>,
) {
  const buildId = randomUUID();
  latestBuildId = buildId;
  const controller = new AbortController();
  const build: Build = { id: buildId, projectPath, controller, data };

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
