import path from 'node:path';

import fse from 'fs-extra';

import type {
  GamePlugin,
  PluginEventDefinition,
  PluginEventField,
  PluginManifest,
  PluginPick,
  ProjectPlugin,
} from '../types';

export const PLUGIN_MANIFEST = 'plugin.json';

const ID_REGEX = /^[a-z0-9][a-z0-9_-]*$/i;
const KEY_REGEX = /^[a-z_][a-z0-9_]*$/i;
const HANDLER_REGEX = /^[a-z_][a-z0-9_]*(::[a-z_][a-z0-9_]*)*$/i;
const FIELD_TYPES = ['number', 'text', 'boolean', 'select'];

export const resolvePluginDir = (projectPath: string, pluginPath: string) =>
  path.resolve(path.dirname(projectPath), pluginPath);

export const toProjectPluginPath = (projectPath: string, dir: string) =>
  path.relative(path.dirname(projectPath), dir).split(path.sep).join('/');

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

export const loadPlugins = async (
  projectPath: string,
  entries: ProjectPlugin[] = [],
): Promise<GamePlugin[]> => {
  const plugins: GamePlugin[] = [];
  const ids = new Set<string>();

  for (const entry of entries) {
    const dir = resolvePluginDir(projectPath, entry.path);

    try {
      const manifest = await readManifest(dir);

      if (ids.has(manifest.id)) {
        throw new Error(`Duplicate plugin id "${manifest.id}"`);
      }

      ids.add(manifest.id);
      plugins.push({
        ...manifest,
        enabled: entry.enabled !== false,
        _dir: dir,
        _path: entry.path,
      });
    } catch (e) {
      plugins.push({
        id: entry.path,
        name: path.basename(dir),
        events: [],
        enabled: false,
        _dir: dir,
        _path: entry.path,
        _error: !await fse.pathExists(dir)
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
