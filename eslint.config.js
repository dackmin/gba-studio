import { defineConfig } from 'eslint/config';
import pooolint from '@poool/eslint-config-react';

export default defineConfig(
  {
    ignores: [
      'node_modules', 'dist', '.yarn', '.dev', 'build', '.vite', 'out',
      'public', '**/.vite',
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  pooolint.configs.recommended,
  {
    rules: {
      '@eslint-react/static-components': 'off',
      '@eslint-react/no-array-index-key': 'off',
      '@eslint-react/set-state-in-effect': 'off',
    },
  },
);
