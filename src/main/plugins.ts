import os from 'node:os';
import path from 'node:path';

import fse from 'fs-extra';

import { extractArchive } from './archive';
import type {
  GameBackgroundFile,
  GameFontFile,
  GameMusicFile,
  GamePlugin,
  GameScript,
  GameSoundFile,
  GameSpriteFile,
  GameVariables,
  PluginAssets,
  PluginEventDefinition,
  PluginEventField,
  PluginManifest,
  PluginPick,
  ProjectPlugin,
} from '../types';
import { toFileSlug, toPluginId } from '../helpers';
import {
  getAudioFiles,
  getGraphicFileSize,
  getGraphicsFiles,
  getScriptsFiles,
  getVariableFiles,
} from './files';
import {
  sanitizeBackground,
  sanitizeFont,
  sanitizeMusic,
  sanitizeScript,
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

const PLUGIN_REFERENCES: Record<string, string[]> = {
  'variable': ['name', 'variables'],
  'set-variable': ['name', 'variables'],
  'on-variable-change': ['variable', 'variables'],
  'execute-script': ['script', 'scripts'],
};

export type PluginReferences = Record<string, Map<string, string>>;

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

const readContentJson = async (dir: string, file: string) => {
  try {
    return await fse.readJson(path.join(dir, 'content', file));
  } catch (e: any) {
    throw new Error(`Invalid content/${file}: ${e?.message}`);
  }
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
    const raw = await readContentJson(dir, file);
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
      id: toPluginId(manifest.id, raw.id ?? key),
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

const remapReferences = (node: any, refs: PluginReferences): any => {
  if (typeof node === 'string') {
    return refs.params.get(node) ?? node;
  }

  if (Array.isArray(node)) {
    return node.map(n => remapReferences(n, refs));
  }

  if (!node || typeof node !== 'object') {
    return node;
  }

  const res = Object.fromEntries(Object.entries(node)
    .map(([k, v]) => [k, remapReferences(v, refs)]));
  const [key, kind] = PLUGIN_REFERENCES[node.type] ?? [];

  if (key && kind && refs[kind].has(res[key])) {
    res[key] = refs[kind!].get(res[key]);
  }

  return res;
};

export const resolveScriptParams = (script: GameScript): GameScript => {
  const params = new Map((script.parameters ?? []).map(({ id }) => [
    `param:${id}`, `__script_param_${id}`,
  ]));

  if (!params.size) {
    return script;
  }

  return {
    ...script,
    events: remapReferences(script.events ?? [], {
      variables: new Map(), scripts: new Map(), params,
    }),
  };
};

const resolveVariables = async (manifest: PluginManifest, dir: string) => {
  const registries: GameVariables[] = [];
  const ids = new Map<string, string>();
  const names = new Set<string>();

  for (const file of await getVariableFiles(dir)) {
    const raw = await readContentJson(dir, file);
    const key = file.replace(/\.json$/, '');

    registries.push({
      ...raw,
      type: 'variables',
      id: toPluginId(manifest.id, raw.id ?? key),
      _file: `variables_${getPluginAssetName(manifest.id, key)}.json`,
      _plugin: manifest.id,
      values: (raw.values ?? []).map((value: any) => {
        if (!value?.name) {
          throw new Error(`content/${file}: a variable has no name`);
        }

        if (names.has(value.name)) {
          throw new Error(`content/${file}: another variable is already named "${value.name}"`);
        }

        const id = toPluginId(manifest.id, value.id ?? value.name);

        names.add(value.name);
        ids.set(value.name, id);
        ids.set(value.id ?? value.name, id);

        return {
          ...value,
          type: 'variable',
          id,
          name: `${manifest.id}_${value.name}`,
          _label: value.name,
        };
      }),
    });
  }

  return { registries, ids };
};

const assignEventIds = (events: any[] | undefined, prefix: string) => {
  (events ?? []).forEach((event, index) => {
    if (!event || typeof event !== 'object') {
      return;
    }

    event.id ??= `${prefix}:${index}`;

    for (const key of ['events', 'then', 'else']) {
      if (Array.isArray(event[key])) {
        assignEventIds(event[key], `${event.id}:${key}`);
      }
    }

    (Array.isArray(event.choices) ? event.choices : []).forEach((choice: any, i: number) => {
      choice.id ??= `${event.id}:choice:${i}`;
      assignEventIds(choice.events, `${choice.id}:events`);
    });
  });
};

const resolveScripts = async (
  manifest: PluginManifest,
  dir: string,
  variables: Map<string, string>,
): Promise<GameScript[]> => {
  // read everything first so scripts can reference each other
  const raws = await Promise.all((await getScriptsFiles(dir)).map(async file => {
    const raw = await readContentJson(dir, file);
    const key = file.replace(/\.json$/, '').replace(/^script_/, '');

    return { file, key, raw, id: toPluginId(manifest.id, raw.id ?? key) };
  }));
  const scripts = new Map(raws.flatMap(({ key, raw, id }) => [[key, id], [raw.id ?? key, id]]));
  const names = new Set<string>();

  const resolved = raws.map(({ file, key, raw, id }) => {
    const name = raw.name || key;

    if (names.has(toFileSlug(name))) {
      throw new Error(`content/${file}: another script is already named "${name}"`);
    }

    names.add(toFileSlug(name));

    const params = new Map<string, string>();
    const parameters = (raw.parameters ?? []).map((parameter: any, index: number) => {
      const paramId = parameter.id ?? `p${index}`;

      if (!ID_REGEX.test(paramId)) {
        throw new Error(`content/${file}: invalid parameter id "${paramId}"`);
      }

      const resolved = `__script_param_${id}:${paramId}`;
      params.set(`param:${paramId}`, resolved);
      params.set(`__script_param_${paramId}`, resolved);

      return { ...parameter, id: `${id}:${paramId}` };
    });

    return {
      ...raw,
      type: 'script',
      id,
      name,
      parameters,
      events: remapReferences(raw.events ?? [], { variables, scripts, params }),
      _file: `script_${getPluginAssetName(manifest.id, key)}.json`,
      _plugin: manifest.id,
    };
  });

  for (const script of resolved) {
    assignEventIds(script.events, script.id);
    await sanitizeScript(script);
  }

  return resolved;
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
      const { registries: _variables, ids: variableIds } = await resolveVariables(manifest, dir);
      const _scripts = await resolveScripts(manifest, dir, variableIds);

      ids.add(manifest.id);
      slugs.add(toFileSlug(manifest.id));
      plugins.push({
        ...manifest,
        enabled: entry.enabled !== false,
        _dir: dir,
        _path: entry.path,
        _assets,
        _scripts,
        _variables,
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
