import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/renderer/preload.ts',
      formats: ['cjs'],
      name: 'preload',
    },
  },
});
