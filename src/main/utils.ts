import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export const isDev = () =>
  typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== 'undefined' &&
  !!MAIN_WINDOW_VITE_DEV_SERVER_URL;

export const getResourcesDir = () => {
  if (isDev()) {
    const url = path.join(__dirname, '../../');

    if (process.platform === 'win32') {
      return url.slice(1);
    } else {
      return url;
    }
  } else {
    return process.resourcesPath ??
      // needed by CLI
      process.env.GBAS_RESOURCES_PATH;
  }
};

export const shQuote = (value: string) =>
  `'${value.replace(/'/g, `'\\''`)}'`;

export const isOnPath = (dir: string, p?: string) => (p ?? '')
  .split(path.delimiter)
  .includes(dir);
