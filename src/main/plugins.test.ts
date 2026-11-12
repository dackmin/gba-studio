import os from 'node:os';
import path from 'node:path';

import { TextReader, Uint8ArrayWriter, ZipWriter } from '@zip.js/zip.js';
import fse from 'fs-extra';
import * as tar from 'tar';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  getPluginAssetName,
  installPluginArchive,
  loadPlugins,
  parseEventField,
  registerPluginDirs,
  resolvePluginFile,
} from './plugins';

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

describe('parseEventField', () => {
  it.each(['sprite', 'background', 'font', 'sound', 'music'])(
    'accepts %s fields',
    type => {
      expect(parseEventField({ key: 'asset', type }, 'evt'))
        .toMatchObject({ key: 'asset', type });
    },
  );

  it('rejects unknown field types', () => {
    expect(() => parseEventField({ key: 'asset', type: 'palette' }, 'evt'))
      .toThrow('invalid type');
  });
});

describe('main/plugins', () => {
  let tmp: string;
  let projectPath: string;

  beforeEach(async () => {
    tmp = await fse.mkdtemp(path.join(os.tmpdir(), 'gbas-plugins-'));
    projectPath = path.join(tmp, 'game', 'game.gbasproj');

    await fse.outputFile(path.join(tmp, 'plug', 'graphics', 'hero.bmp'), 'bmp');
    await fse.outputFile(path.join(tmp, 'plug', 'audio', 'jump.wav'), 'wav');
    await fse.outputJson(path.join(tmp, 'plug', 'plugin.json'), {
      id: 'my-plugin',
    });
    await fse.outputJson(path.join(tmp, 'plug', 'content', 'sprite_hero.json'), {
      type: 'sprite',
      name: 'Hero',
      path: 'graphics/hero.bmp',
      width: 16,
      height: 16,
      discoverable: false,
    });
    await fse.outputJson(path.join(tmp, 'plug', 'content', 'sound_jump.json'), {
      type: 'sound',
      name: 'Jump',
      path: 'audio/jump.wav',
    });
  });

  it('resolves assets relative to the project', async () => {
    const [plugin] = await loadPlugins(projectPath, [{ path: '../plug' }]);

    expect(plugin._error).toBeUndefined();
    expect(plugin._assets?.sprites[0]).toMatchObject({
      id: 'plugin:my-plugin:hero',
      name: 'Hero',
      path: '../plug/graphics/hero.bmp',
      width: 16,
      discoverable: false,
      _file: `sprite_${getPluginAssetName('my-plugin', 'hero')}.json`,
      _plugin: 'my-plugin',
      _url: 'plugin://asset/my-plugin/graphics/hero.bmp',
    });
    expect(plugin._assets?.sounds[0]).toMatchObject({
      id: 'plugin:my-plugin:jump',
      name: 'Jump',
      format: 'wav',
      _file: 'sound_plugin_my_plugin_jump.json',
    });
  });

  it('rejects paths outside of the plugin folder', async () => {
    await fse.outputJson(path.join(tmp, 'plug', 'content', 'sprite_evil.json'), {
      type: 'sprite',
      path: '../game/evil.bmp',
    });

    const [plugin] = await loadPlugins(projectPath, [{ path: '../plug' }]);

    expect(plugin.enabled).toBe(false);
    expect(plugin._error).toContain('inside the plugin folder');
  });

  it('rejects wrong extensions', async () => {
    await fse.outputJson(path.join(tmp, 'plug', 'content', 'sprite_png.json'), {
      type: 'sprite',
      path: 'graphics/hero.png',
    });

    const [plugin] = await loadPlugins(projectPath, [{ path: '../plug' }]);

    expect(plugin._error).toContain('.bmp');
  });

  it('rejects sprite and background sharing a name', async () => {
    await fse.outputJson(path.join(tmp, 'plug', 'content', 'background_hero.json'), {
      type: 'background',
      path: 'graphics/hero.bmp',
    });

    const [plugin] = await loadPlugins(projectPath, [{ path: '../plug' }]);

    expect(plugin._error).toContain('already named');
  });

  it('reports missing asset files', async () => {
    await fse.remove(path.join(tmp, 'plug', 'audio', 'jump.wav'));

    const [plugin] = await loadPlugins(projectPath, [{ path: '../plug' }]);

    expect(plugin.enabled).toBe(false);
    expect(plugin._error).toContain('not found');
  });

  it('only serves files inside registered plugin folders', async () => {
    const plugins = await loadPlugins(projectPath, [{ path: '../plug' }]);

    registerPluginDirs(projectPath, plugins);

    expect(resolvePluginFile(projectPath, 'my-plugin', 'graphics/hero.bmp'))
      .toBe(path.join(tmp, 'plug', 'graphics', 'hero.bmp'));
    expect(resolvePluginFile(projectPath, 'my-plugin', '../game/game.gbasproj'))
      .toBeUndefined();
    expect(resolvePluginFile(projectPath, 'other', 'graphics/hero.bmp'))
      .toBeUndefined();
  });

  afterEach(async () => {
    await fse.remove(tmp);
  });
});

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
