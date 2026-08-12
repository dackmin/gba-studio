import type { UserConfig } from '@commitlint/types';

export const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['chore', 'feat', 'refactor', 'fix', 'style',
      'docs', 'test', 'tests', 'deploy']],
  },
};

export default config;
