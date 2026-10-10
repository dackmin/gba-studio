import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export const isDev = () =>
  typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== 'undefined' &&
  !!MAIN_WINDOW_VITE_DEV_SERVER_URL;

export const getResourcesDir = () => {
  // Non-Electron hosts (sidecar) pass the directory that contains `public/`
  if (process.env.GBAS_RESOURCES) {
    return process.env.GBAS_RESOURCES;
  }

  if (isDev()) {
    const url = path.join(__dirname, '../../');

    if (process.platform === 'win32') {
      return url.slice(1);
    } else {
      return url;
    }
  } else {
    return process.resourcesPath;
  }
};
