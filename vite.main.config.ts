import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rolldownOptions: {
      platform: 'node',
    },
    lib: {
      entry: 'src/main/index.ts',
      formats: ['es'],
      name: 'main',
      fileName: () => 'main.js',
    },
  },
});
