import fs from 'node:fs';
import path from 'node:path';

import { app } from 'electron';

import type { AppStorage, GameProject } from '../types';

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

    return fs.promises.writeFile(
      configPath,
      JSON.stringify(this.config, null, 2) + '\n',
      'utf-8'
    );
  }

  addToRecentProjects (projectPath: string, project: GameProject) {
    this.config = {
      ...this.config,
      recentProjects: [
        {
          name: project.name,
          path: projectPath,
        },
        ...(this.config.recentProjects || [])
          .filter(p => p.path !== projectPath).slice(0, 9),
      ],
    };

    return this.save();
  }

  clearRecentProjects () {
    this.config = {
      ...this.config,
      recentProjects: [],
    };

    return this.save();
  }
}
