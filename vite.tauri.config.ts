import { defineConfig, mergeConfig } from 'vite';

import rendererConfig from './vite.renderer.config.ts';

const isolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

export default mergeConfig(rendererConfig, defineConfig({
  clearScreen: false,
  // Never copy the repo-level `public/` folder; it is read in place.
  publicDir: false,
  plugins: [{
    name: 'tauri-drop-meta-csp',
    // Tauri applies the CSP from tauri.conf.json; the Electron meta tag would intersect with it
    transformIndexHtml: html => html.replace(
      /<meta http-equiv="Content-Security-Policy"[^>]*>\s*/,
      '',
    ),
  }],
  server: {
    port: 5173,
    strictPort: true,
    // Tauri only adds these to bundled assets, not to the dev server
    headers: isolationHeaders,
  },
  build: {
    outDir: '../../.vite/renderer/tauri',
    emptyOutDir: true,
  },
}));
