import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rolldownOptions: {
      platform: 'node',
      external: [],
    },
    lib: {
      entry: 'src/cli/index.ts',
      formats: ['es'],
      name: 'cli',
      fileName: () => 'cli.js',
    },
  },
});
