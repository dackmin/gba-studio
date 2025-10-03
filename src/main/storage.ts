import fs from 'node:fs';
import path from 'node:path';

import { app } from 'electron';

import type { AppStorage } from '../types';

export default class Storage {
  config: AppStorage = {};

  constructor () {
    const configPath = path.join(app.getPath('userData'), 'config.json');

    if (!fs.existsSync(path.dirname(configPath))) {
      fs.mkdirSync(path.dirname(configPath), { recursive: true });
    }

    try {
      this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {}
  }

  save () {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    fs.promises.writeFile(
      configPath,
      JSON.stringify(this.config, null, 2) + '\n',
      'utf-8'
    );
  }
}
