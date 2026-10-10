/// <reference types="electron" />
/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />
/// <reference types="./src/types.ts" />
/// <reference types="jimp" />

interface ImportMetaEnv {
  readonly VITE_SCHEMAS_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  bridge: import('./src/types').AppBridge;
}

declare module '*.svg?url' {
  const content: string;
  export default content;
}

declare module '*.png?url' {
  const content: string;
  export default content;
}
