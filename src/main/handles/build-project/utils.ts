import { type SpawnOptions, spawn } from 'node:child_process';
import path from 'node:path';

import type{ IpcMainInvokeEvent } from 'electron';
import slugify from 'slugify';
import { v4 as uuid } from 'uuid';

import type { Build } from '../../../types';

export function sendStep (
  event: IpcMainInvokeEvent,
  buildId: string,
  message: string
) {
  event.sender.send('build-step', {
    id: buildId,
    message,
  });
}

export function sendLog (
  event: IpcMainInvokeEvent,
  buildId: string,
  message: string
) {
  event.sender.send('build-log', {
    id: buildId,
    type: 'log',
    message,
  });
}

export function sendError (
  event: IpcMainInvokeEvent,
  buildId: string,
  message: string
) {
  event.sender.send('build-log', {
    id: buildId,
    type: 'error',
    message,
    messageId: uuid(),
  });
  event.sender.send('build-error', {
    id: buildId,
    message,
    messageId: uuid(),
  });
}

export function sendSuccessLog (
  event: IpcMainInvokeEvent,
  buildId: string,
  message: string
) {
  event.sender.send('build-log', {
    id: buildId,
    type: 'success',
    message,
    messageId: uuid(),
  });
}

export function sendAbort (
  event: IpcMainInvokeEvent,
  buildId: string,
) {
  event.sender.send('build-aborted', {
    id: buildId,
    messageId: uuid(),
  });
}

export function runCommand (
  command: string,
  args: string[],
  opts?: {
    cwd?: string;
    event?: IpcMainInvokeEvent;
    build?: Build;
    log?: boolean;
    logErrors?: boolean;
  },
  spawnOpts?: SpawnOptions,
) {
  return new Promise<string>((resolve, reject) => {
    const process = spawn(command, args, {
      cwd: opts?.cwd,
      stdio: 'pipe',
      ...spawnOpts,
    });

    process.on('error', err => {
      reject(err);
    });

    opts?.build?.controller?.signal.addEventListener('abort', () => {
      process.kill();
      reject(new Error(`${command} process aborted`));
    });

    let res = '';
    let line = '';

    process.stdout?.on('data', data => {
      res += data.toString();
      line += data.toString();

      if (
        opts?.event &&
        opts?.build &&
        line.includes('\n') &&
        opts?.log !== false
      ) {
        sendLog(opts.event, opts.build.id, line.trim());
        line = '';
      }
    });

    let err = '';
    let errLine = '';

    process.stderr?.on('data', data => {
      err += data.toString();
      errLine += data.toString();

      if (
        opts?.event &&
        opts?.build &&
        errLine.includes('\n') &&
        opts?.logErrors !== false
      ) {
        sendError(opts.event, opts.build.id, data.toString());
        line = '';
      }
    });

    process.on('close', code => {
      if (code === 0) {
        resolve(res);
      } else {
        reject(new Error(err));
      }
    });
  });
}

export const toSlug = (str: string) => slugify(str, {
  lower: true,
  strict: true,
  replacement: '_',
});

export const getBuildDir = (build: Build) => {
  return path.join(path.dirname(build.projectPath), 'tmp');

  // TODO: Try to understand why temp dir does not work with
  // make/butano/devkitpro
  //
  // const outputDirName = toSlug(path.basename(build.projectPath,
  //   path.extname(build.projectPath)));
  //
  // return path.join(app.getPath('temp'), 'gba-studio', outputDirName);
};
