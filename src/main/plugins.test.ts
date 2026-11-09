import os from 'node:os';
import path from 'node:path';

import { TextReader, Uint8ArrayWriter, ZipWriter } from '@zip.js/zip.js';
import fse from 'fs-extra';
import * as tar from 'tar';

import { installPluginArchive } from './plugins';

const manifest = JSON.stringify({
  id: 'my-plugin',
  name: 'My Plugin',
  events: [{ id: 'hello', handler: 'hello_world' }],
});

const createZip = async (files: Record<string, string>, level = 6) => {
  const writer = new ZipWriter(new Uint8ArrayWriter(), { level });

  for (const [name, text] of Object.entries(files)) {
    await writer.add(name, new TextReader(text));
  }

  return Buffer.from(await writer.close());
};

describe('installPluginArchive', () => {
  let tmp: string;
  let projectPath: string;

  beforeEach(async () => {
    tmp = await fse.mkdtemp(path.join(os.tmpdir(), 'gba-studio-test-'));
    projectPath = path.join(tmp, 'project', 'game.gbasproj');
    await fse.ensureDir(path.dirname(projectPath));
  });

  afterEach(async () => {
    await fse.remove(tmp);
  });

  it.each([6, 0])('installs a zip (compression level %i)', async level => {
    const file = path.join(tmp, 'plugin.zip');

    await fse.writeFile(file, await createZip({
      'plugin.json': manifest,
      'src/hello.cpp': 'void hello_world() {}',
    }, level));

    const result = await installPluginArchive(projectPath, file);

    expect(result).toEqual({ path: 'plugins/my-plugin' });
    expect(await fse.readFile(
      path.join(path.dirname(projectPath), 'plugins/my-plugin/src/hello.cpp'),
      'utf8',
    )).toBe('void hello_world() {}');
  });

  it('installs a zip wrapped in a top folder', async () => {
    const file = path.join(tmp, 'plugin.zip');

    await fse.writeFile(file, await createZip({
      'wrapper/plugin.json': manifest,
      'wrapper/include/a.h': '#pragma once',
    }));

    const result = await installPluginArchive(projectPath, file);

    expect(result).toEqual({ path: 'plugins/my-plugin' });
    expect(await fse.pathExists(path.join(
      path.dirname(projectPath), 'plugins/my-plugin/include/a.h'))).toBe(true);
  });

  it('installs a tar.gz', async () => {
    const src = path.join(tmp, 'src');
    const file = path.join(tmp, 'plugin.tar.gz');

    await fse.outputFile(path.join(src, 'plugin.json'), manifest);
    await fse.outputFile(path.join(src, 'src/a.cpp'), '// a');
    await tar.create({ gzip: true, file, cwd: src }, ['.']);

    const result = await installPluginArchive(projectPath, file);

    expect(result).toEqual({ path: 'plugins/my-plugin' });
    expect(await fse.pathExists(path.join(
      path.dirname(projectPath), 'plugins/my-plugin/src/a.cpp'))).toBe(true);
  });

  it('replaces an existing install', async () => {
    const file = path.join(tmp, 'plugin.zip');
    const dir = path.join(path.dirname(projectPath), 'plugins/my-plugin');

    await fse.outputFile(path.join(dir, 'old.txt'), 'old');
    await fse.writeFile(file, await createZip({ 'plugin.json': manifest }));
    await installPluginArchive(projectPath, file);

    expect(await fse.pathExists(path.join(dir, 'old.txt'))).toBe(false);
    expect(await fse.pathExists(path.join(dir, 'plugin.json'))).toBe(true);
  });

  it('rejects a zip without manifest', async () => {
    const file = path.join(tmp, 'plugin.zip');

    await fse.writeFile(file, await createZip({ 'readme.md': 'hi' }));

    const result = await installPluginArchive(projectPath, file);

    expect(result.error).toMatch(/plugin\.json not found/);
  });

  it('rejects path traversal in zip', async () => {
    const file = path.join(tmp, 'plugin.zip');

    await fse.writeFile(file, await createZip({
      'plugin.json': manifest,
      '../../evil.txt': 'evil',
    }));

    const result = await installPluginArchive(projectPath, file);

    expect(result.error).toMatch(/Unsafe/);
    expect(await fse.pathExists(path.join(tmp, 'evil.txt'))).toBe(false);
  });

  it('rejects unsupported and invalid archives', async () => {
    const txt = path.join(tmp, 'plugin.rar');
    const zip = path.join(tmp, 'broken.zip');

    await fse.writeFile(txt, 'nope');
    await fse.writeFile(zip, 'not a zip');

    expect((await installPluginArchive(projectPath, txt)).error)
      .toMatch(/Unsupported archive/);
    expect((await installPluginArchive(projectPath, zip)).error)
      .toMatch(/not recognized/);
  });
});
