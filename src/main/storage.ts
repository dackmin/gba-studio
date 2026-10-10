import fs from 'node:fs';
import path from 'node:path';

import type { AppStorage, GameProject } from '../types';

export default class Storage {
  config: AppStorage = {};
  configPath: string;

  constructor (userDataDir: string) {
    this.configPath = path.join(userDataDir, 'config.json');

    if (!fs.existsSync(path.dirname(this.configPath))) {
      fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
    }

    try {
      this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
    } catch {}
  }

  save () {
    return fs.promises.writeFile(
      this.configPath,
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

  removeRecentProject (projectPath: string) {
    this.config = {
      ...this.config,
      recentProjects: (this.config.recentProjects || [])
        .filter(p => p.path !== projectPath),
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

  addToClipboard (data: any) {
    this.config = {
      ...this.config,
      clipboard: data,
    };

    return this.save();
  }
}
