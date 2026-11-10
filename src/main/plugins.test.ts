import os from 'node:os';
import path from 'node:path';

import fse from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  getPluginAssetName,
  loadPlugins,
  parseEventField,
  registerPluginDirs,
  resolvePluginFile,
} from './plugins';

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
