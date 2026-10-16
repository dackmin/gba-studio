import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    globalSetup: './tests/global-setup.ts',
    exclude: [
      'node_modules/**',
      'out/**',
    ],
    environment: 'node',
  },
});
