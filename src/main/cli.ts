import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { app, dialog } from 'electron';

import { shQuote, isOnPath } from './utils';

const execFileAsync = promisify(execFile);

const CLI_NAME = 'gba-studio';

const getPosixShim = (execPath: string, cliPath: string) => [
  '#!/bin/sh',
  `export GBAS_RESOURCES_PATH=${shQuote(process.resourcesPath)}`,
  `ELECTRON_RUN_AS_NODE=1 exec ${shQuote(execPath)} ${shQuote(cliPath)} "$@"`,
  '',
].join('\n');

const getWindowsShim = (execPath: string, cliPath: string) => [
  '@echo off',
  'setlocal',
  'set ELECTRON_RUN_AS_NODE=1',
  `set "GBAS_RESOURCES_PATH=${process.resourcesPath}"`,
  `"${execPath}" "${cliPath}" %*`,
  'exit /b %errorlevel%',
  '',
].join('\r\n');

const updateWindowsPath = async (dir: string, action: 'add' | 'remove') => {
  const script = [
    '$dir = $env:GBAS_CLI_DIR',
    '$current = [Environment]::GetEnvironmentVariable(\'Path\', \'User\')',
    'if (-not $current) { $current = \'\' }',
    '$parts = @($current -split \';\' | Where-Object { $_ })',
    action === 'add'
      ? 'if ($parts -contains $dir) { exit 0 }; $parts = $parts + $dir'
      : 'if ($parts -notcontains $dir) { exit 0 }; ' +
        '$parts = @($parts | Where-Object { $_ -ne $dir })',
    '[Environment]::SetEnvironmentVariable(\'Path\', ($parts -join \';\'), \'User\')',
  ].join('\n');

  await execFileAsync('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    script,
  ], { env: { ...process.env, GBAS_CLI_DIR: dir } });
};

const getWindowsDir = () => path.join(
  process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local'),
  'GBAStudio',
  'bin'
);

const getShimPaths = () => process.platform === 'win32'
  ? [path.join(getWindowsDir(), `${CLI_NAME}.cmd`)]
  : [
    path.join('/usr/local/bin', CLI_NAME),
    path.join(os.homedir(), '.local', 'bin', CLI_NAME),
  ];

const getCliPath = () => path.join(
  app.getAppPath(), '.vite', 'build', 'cli.js'
);

const findInstalled = async () => {
  const found: { file: string; current: boolean }[] = [];

  for (const file of getShimPaths()) {
    try {
      const stat = await fsp.lstat(file);

      if (!stat.isFile()) {
        continue;
      }

      const content = await fsp.readFile(file, 'utf-8');

      if (content.includes('GBAS_RESOURCES_PATH')) {
        found.push({ file, current: content.includes(getCliPath()) });
      }
    } catch {}
  }

  return found;
};

const runAdminMac = async (shell: string) => {
  const script = `do shell script "${
    shell.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  }" with administrator privileges`;

  await execFileAsync('osascript', ['-e', script]);
};

const isPermissionError = (e: unknown) =>
  ['EACCES', 'EPERM', 'ENOENT'].includes((e as NodeJS.ErrnoException).code!);

const writeShim = async (dir: string, content: string, mode: number) => {
  await fsp.mkdir(dir, { recursive: true });
  await fsp.writeFile(path.join(dir, CLI_NAME), content, { mode });
  await fsp.chmod(path.join(dir, CLI_NAME), mode);
};

const installWithAdminMac = async (dir: string, content: string) => {
  const tmpFile = path.join(
    await fsp.mkdtemp(path.join(os.tmpdir(), 'gbas-cli-')),
    CLI_NAME
  );

  await fsp.writeFile(tmpFile, content, { mode: 0o755 });

  const target = path.join(dir, CLI_NAME);

  try {
    await runAdminMac(
      `mkdir -p ${shQuote(dir)} && cp ${shQuote(tmpFile)} ` +
      `${shQuote(target)} && chmod 755 ${shQuote(target)}`
    );
  } finally {
    await fsp.rm(path.dirname(tmpFile), { recursive: true, force: true });
  }
};

const installWindows = async (execPath: string, cliPath: string) => {
  const dir = getWindowsDir();

  await fsp.mkdir(dir, { recursive: true });
  await fsp.writeFile(
    path.join(dir, `${CLI_NAME}.cmd`),
    getWindowsShim(execPath, cliPath)
  );
  await updateWindowsPath(dir, 'add');

  return `Installed \`${CLI_NAME}\` to ${dir} and added it to your PATH. ` +
    'Restart your terminal to use it.';
};

const installPosix = async (execPath: string, cliPath: string) => {
  const content = getPosixShim(execPath, cliPath);
  const systemDir = '/usr/local/bin';

  try {
    await writeShim(systemDir, content, 0o755);

    return `Installed \`${CLI_NAME}\` to ${systemDir}.`;
  } catch (e) {
    if (!isPermissionError(e)) {
      throw e;
    }
  }

  if (process.platform === 'darwin') {
    await installWithAdminMac(systemDir, content);

    return `Installed \`${CLI_NAME}\` to ${systemDir}.`;
  }

  const userDir = path.join(os.homedir(), '.local', 'bin');
  await writeShim(userDir, content, 0o755);

  return `Installed \`${CLI_NAME}\` to ${userDir}.` +
    (!isOnPath(userDir, process.env.PATH) ? ` Add this folder to your PATH to use it.` : '');
};

const uninstall = async (files: string[]) => {
  for (const file of files) {
    try {
      await fsp.unlink(file);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        continue;
      }

      if (process.platform === 'darwin' && isPermissionError(e)) {
        await runAdminMac(`rm -f ${shQuote(file)}`);
      } else {
        throw e;
      }
    }
  }

  if (process.platform === 'win32') {
    const dir = getWindowsDir();
    await updateWindowsPath(dir, 'remove');

    // don't do shit if it failed because it's not empty
    await fsp.rmdir(dir).catch(() => {});
  }
};

const install = async () => {
  const cliPath = getCliPath();

  const message = process.platform === 'win32'
    ? await installWindows(process.execPath, cliPath)
    : await installPosix(process.execPath, cliPath);

  await dialog.showMessageBox({
    type: 'info',
    message: 'CLI tools installed',
    detail: message,
  });
};

export const installCliTools = async () => {
  try {
    if (!app.isPackaged) {
      throw new Error('CLI tools can only be installed from a packaged app.');
    }

    const installed = await findInstalled();

    if (installed.length === 0) {
      await install();

      return;
    }

    const stale = installed.some(item => !item.current);
    const { response } = await dialog.showMessageBox({
      type: 'question',
      message: 'CLI tools are already installed',
      detail: installed.map(item => item.file).join('\n') + (stale
        ? '\n\nAt least one installation points to a different copy of the app.'
        : ''),
      buttons: ['Uninstall', 'Reinstall', 'Cancel'],
      defaultId: 2,
      cancelId: 2,
    });

    if (response === 2) {
      return;
    }

    await uninstall(installed.map(item => item.file));

    if (response === 1) {
      await install();
    } else {
      await dialog.showMessageBox({
        type: 'info',
        message: 'CLI tools uninstalled',
      });
    }
  } catch (e) {
    dialog.showErrorBox(
      'Unable to manage CLI tools',
      (e as Error).message
    );
  }
};
