import os from 'node:os';
import path from 'node:path';

import fse from 'fs-extra';

import { extractArchive } from './archive';
import type {
  GameBackgroundFile,
  GameFontFile,
  GameMusicFile,
  GamePlugin,
  GameSoundFile,
  GameSpriteFile,
  PluginAssets,
  PluginEventDefinition,
  PluginEventField,
  PluginManifest,
  PluginPick,
  ProjectPlugin,
} from '../types';
import { toFileSlug } from '../helpers';
import { getAudioFiles, getGraphicFileSize, getGraphicsFiles } from './files';
import {
  sanitizeBackground,
  sanitizeFont,
  sanitizeMusic,
  sanitizeSound,
  sanitizeSprite,
} from './sanitize';

export const PLUGIN_MANIFEST = 'plugin.json';
export const PLUGINS_DIR = 'plugins';

export const ID_REGEX = /^[a-z0-9][a-z0-9_-]*$/i;
export const KEY_REGEX = /^[a-z_][a-z0-9_]*$/i;
export const HANDLER_REGEX = /^[a-z_][a-z0-9_]*(::[a-z_][a-z0-9_]*)*$/i;
export const FIELD_TYPES = [
  'number',
  'text',
  'boolean',
  'select',
  'sprite',
  'background',
  'font',
  'sound',
  'music',
];
export const ASSET_EXTENSIONS = {
  sprite: '.bmp',
  background: '.bmp',
  font: '.bmp',
  sound: '.wav',
  music: '.mod',
} as const;

// Avoids re-reading plugins list manifests on every plugin:// call (essentially a plugins cache)
const pluginDirs = new Map<string, Map<string, string>>();

export const resolvePluginDir = (projectPath: string, pluginPath: string) =>
  path.resolve(path.dirname(projectPath), pluginPath);

export const toProjectPluginPath = (projectPath: string, dir: string) =>
  path.relative(path.dirname(projectPath), dir).split(path.sep).join('/');

// Name Butano generates the item from -> `bn::sprite_items::<name>`
export const getPluginAssetName = (pluginId: string, assetId: string) =>
  `plugin_${toFileSlug(pluginId)}_${toFileSlug(assetId)}`;

export const parseEventField = (raw: any, eventId: string): PluginEventField => {
  if (!KEY_REGEX.test(raw?.key ?? '')) {
    throw new Error(`Event "${eventId}" has a field with an invalid key`);
  }

  if (!FIELD_TYPES.includes(raw.type)) {
    throw new Error(
      `Field "${raw.key}" of event "${eventId}" has an invalid type`);
  }

  if (raw.type === 'select' && !Array.isArray(raw.options)) {
    throw new Error(
      `Select field "${raw.key}" of event "${eventId}" needs options`);
  }

  return {
    key: raw.key,
    type: raw.type,
    label: typeof raw.label === 'string' ? raw.label : undefined,
    unit: typeof raw.unit === 'string' ? raw.unit : undefined,
    text: typeof raw.text === 'string' ? raw.text : undefined,
    default: raw.default,
    options: raw.type === 'select'
      ? raw.options.map((o: any) => typeof o === 'string'
        ? { value: o }
        : { value: String(o?.value ?? ''), label: o?.label })
      : undefined,
  };
};

export const parseEvent = (raw: any): PluginEventDefinition => {
  if (!ID_REGEX.test(raw?.id ?? '')) {
    throw new Error('An event has a missing or invalid id');
  }

  if (!HANDLER_REGEX.test(raw.handler ?? '')) {
    throw new Error(`Event "${raw.id}" has a missing or invalid handler`);
  }

  const fields: PluginEventField[] = (raw.fields ?? [])
    .map((f: any) => parseEventField(f, raw.id));

  if (new Set(fields.map(f => f.key)).size !== fields.length) {
    throw new Error(`Event "${raw.id}" has duplicate field keys`);
  }

  return {
    id: raw.id,
    name: typeof raw.name === 'string' && raw.name ? raw.name : raw.id,
    description: raw.description,
    keywords: Array.isArray(raw.keywords) ? raw.keywords : undefined,
    handler: raw.handler,
    fields,
  };
};

export const parseManifest = (raw: Partial<PluginManifest>): PluginManifest => {
  if (!ID_REGEX.test(raw?.id ?? '')) {
    throw new Error('Missing or invalid plugin id');
  }

  const events: PluginEventDefinition[] = (raw.events ?? []).map(parseEvent);

  if (new Set(events.map(e => e.id)).size !== events.length) {
    throw new Error('Plugin has duplicate event ids');
  }

  return {
    id: raw.id!,
    name: typeof raw.name === 'string' && raw.name ? raw.name : raw.id!,
    version: raw.version,
    description: raw.description,
    author: raw.author,
    events,
  };
};

const readManifest = async (dir: string): Promise<PluginManifest> => {
  let raw: any;

  try {
    raw = await fse.readJson(path.join(dir, PLUGIN_MANIFEST));
  } catch (e: any) {
    throw new Error(e?.code === 'ENOENT'
      ? `${PLUGIN_MANIFEST} not found`
      : `Invalid ${PLUGIN_MANIFEST}: ${e?.message}`);
  }

  const manifest = parseManifest(raw);

  return manifest;
};

const resolveAssets = async (
  projectPath: string,
  manifest: PluginManifest,
  dir: string,
): Promise<PluginAssets> => {
  const projectDir = path.dirname(projectPath);
  const assets: PluginAssets = { sprites: [], backgrounds: [], fonts: [], sounds: [], music: [] };

  const names = new Set<string>();
  const files = [
    ...await getGraphicsFiles(dir),
    ...await getAudioFiles(dir),
  ];

  for (const file of files) {
    let raw: any;

    try {
      raw = await fse.readJson(path.join(dir, 'content', file));
    } catch (e: any) {
      throw new Error(`Invalid content/${file}: ${e?.message}`);
    }

    const type = raw?.type as keyof typeof ASSET_EXTENSIONS;
    const extension = ASSET_EXTENSIONS[type];

    if (!extension) {
      continue;
    }

    if (
      typeof raw.path !== 'string' ||
      path.extname(raw.path).toLowerCase() !== extension
    ) {
      throw new Error(`content/${file}: path must be a ${extension} file`);
    }

    const absolute = path.resolve(dir, raw.path);
    const relative = path.relative(dir, absolute);

    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`content/${file}: path must be inside the plugin folder`);
    }

    if (!await fse.pathExists(absolute)) {
      throw new Error(`content/${file}: ${raw.path} not found`);
    }

    const key = file.replace(/\.json$/, '')
      .replace(/^(sprite|background|font|sound|music)_/, '');
    const itemName = getPluginAssetName(manifest.id, key);

    if (names.has(itemName)) {
      throw new Error(`content/${file}: another asset is already named "${key}"`);
    }

    names.add(itemName);

    const common = {
      ...raw,
      id: `plugin:${manifest.id}:${raw.id ?? key}`,
      name: raw.name || key,
      path: path.relative(projectDir, absolute).split(path.sep).join('/'),
      _file: `${type}_${itemName}.json`,
      _plugin: manifest.id,
      _url: 'plugin://asset/' + [manifest.id, ...relative.split(path.sep)]
        .map(encodeURIComponent).join('/'),
    };

    switch (type) {
      case 'sprite': {
        const { width, height } = await getGraphicFileSize(absolute);

        assets.sprites.push(await sanitizeSprite({
          ...common,
          width: raw.width ?? width,
          height: raw.height ?? height,
          _realWidth: width,
          _realHeight: height,
        } satisfies GameSpriteFile));
        break;
      }
      case 'background':
        assets.backgrounds.push(
          await sanitizeBackground(common satisfies GameBackgroundFile)
        );
        break;
      case 'font': {
        const { width, height } = await getGraphicFileSize(absolute);

        assets.fonts.push(await sanitizeFont({
          ...common,
          _realWidth: width,
          _realHeight: height,
        } satisfies GameFontFile));
        break;
      }
      case 'sound':
        assets.sounds.push(await sanitizeSound({
          ...common, format: 'wav',
        } satisfies GameSoundFile));
        break;
      case 'music':
        assets.music.push(await sanitizeMusic({
          ...common, format: 'mod',
        } satisfies GameMusicFile));
        break;
    }
  }

  return assets;
};

export const loadPlugins = async (
  projectPath: string,
  entries: ProjectPlugin[] = [],
): Promise<GamePlugin[]> => {
  const plugins: GamePlugin[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const entry of entries) {
    const dir = resolvePluginDir(projectPath, entry.path);

    try {
      const manifest = await readManifest(dir);

      if (ids.has(manifest.id)) {
        throw new Error(`Duplicate plugin id "${manifest.id}"`);
      }

      // Asset names in native code are derived from the slug, so slugs must not clash either
      if (slugs.has(toFileSlug(manifest.id))) {
        throw new Error(
          `Plugin id "${manifest.id}" is too similar to another plugin's`);
      }

      const _assets = await resolveAssets(projectPath, manifest, dir);

      ids.add(manifest.id);
      slugs.add(toFileSlug(manifest.id));
      plugins.push({
        ...manifest,
        enabled: entry.enabled !== false,
        _dir: dir,
        _path: entry.path,
        _assets,
      });
    } catch (e) {
      plugins.push({
        id: entry.path,
        name: path.basename(dir),
        events: [],
        enabled: false,
        _dir: dir,
        _path: entry.path,
        _error: !(await fse.pathExists(dir))
          ? 'Plugin folder not found'
          : (e as Error)?.message ?? 'Invalid plugin',
      });
    }
  }

  return plugins;
};

export const pickPlugin = async (
  projectPath: string,
  dir: string,
): Promise<PluginPick> => {
  try {
    await readManifest(dir);

    return { path: toProjectPluginPath(projectPath, dir) };
  } catch (e: any) {
    return { error: `Could not add plugin: ${e?.message}` };
  }
};

const findPluginRoot = async (dir: string) => {
  if (await fse.pathExists(path.join(dir, PLUGIN_MANIFEST))) {
    return dir;
  }

  const entries = (await fse.readdir(dir, { withFileTypes: true }))
    .filter(e => e.name !== '__MACOSX');

  if (entries.length === 1 && entries[0].isDirectory()) {
    return path.join(dir, entries[0].name);
  }

  return dir;
};

export const installPluginArchive = async (
  projectPath: string,
  archivePath: string,
): Promise<PluginPick> => {
  const tmp = await fse.mkdtemp(path.join(os.tmpdir(), 'gba-studio-plugin-'));

  try {
    await extractArchive(archivePath, tmp);

    const root = await findPluginRoot(tmp);
    const manifest = await readManifest(root);
    const dir = path.join(
      path.dirname(projectPath), PLUGINS_DIR, manifest.id);

    await fse.remove(dir);
    await fse.copy(root, dir);

    return { path: toProjectPluginPath(projectPath, dir) };
  } catch (e: any) {
    return { error: `Could not install plugin: ${e?.message}` };
  } finally {
    await fse.remove(tmp).catch(() => {});
  }
};

export const registerPluginDirs = (
  projectPath: string,
  plugins: GamePlugin[],
) => {
  pluginDirs.set(
    projectPath,
    new Map(plugins.filter(p => !p._error).map(p => [p.id, p._dir])),
  );
};

export const clearPluginsDirs = (projectPath: string) => {
  pluginDirs.delete(projectPath);
};

export const resolvePluginFile = (
  projectPath: string,
  pluginId: string,
  filePath: string,
) => {
  const dir = pluginDirs.get(projectPath)?.get(pluginId);

  if (!dir) {
    return undefined;
  }

  const resolved = path.resolve(dir, filePath);
  const relative = path.relative(dir, resolved);

  return relative && !relative.startsWith('..') && !path.isAbsolute(relative)
    ? resolved
    : undefined;
};

export const getPluginBuildDirs = async (plugins: GamePlugin[]) => {
  const dirs: { sources: string[]; includes: string[] } = {
    sources: [],
    includes: [],
  };

  for (const plugin of plugins) {
    for (const [name, list] of [
      ['src', dirs.sources],
      ['include', dirs.includes],
    ] as const) {
      if (await fse.pathExists(path.join(plugin._dir, name))) {
        list.push(path.join(plugin._dir, name));
      }
    }
  }

  return dirs;
};
