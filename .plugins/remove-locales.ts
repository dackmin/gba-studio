import path from 'node:path';

import debug from 'debug';
import fse from 'fs-extra';

import pkg from '../package.json' with { type: 'json' };

const log = debug('gba-studio:remove-locales');

// https://github.com/barinali/electron-packager-languages/blob/main/src/index.js#L8C1-L19C2
function getLanguageFolderPath (givenPath: string, platform: string) {
  switch (platform) {
    case 'darwin':
    case 'mas':
      return path.resolve(givenPath, '..');
    case 'win32':
    case 'linux':
      return path.resolve(givenPath, '..', '..', 'locales');
    default:
      return path.resolve(givenPath);
  }
}

function getLanguageFileExtension (platform: string) {
  switch (platform) {
    case 'darwin':
    case 'mas':
      return 'lproj';
    case 'win32':
    case 'linux':
      return 'pak';
    default:
      return '';
  }
}

function getElectronLanguageFolderPath (buildPath: string, platform: string) {
  switch (platform) {
    case 'darwin':
    case 'mas':
      return path.join(buildPath, '../../', 'Frameworks',
        'Electron Framework.framework', 'Resources');
    case 'win32':
      return path.join(buildPath, 'resources', 'locales');
    case 'linux':
      return path.join(buildPath, 'locales');
    default:
      return buildPath;
  }
}

export default function removeLocalesPlugin (
  buildPath: string,
  electronVersion: string,
  platform: string,
  arch: string,
  next: (err: Error | null) => void
) {
  if (
    pkg.build?.electronLanguages &&
    pkg.build.electronLanguages.length > 0 &&
    !['win32'].includes(platform)
  ) {
    // Remove from app
    const localesPath = getLanguageFolderPath(buildPath, platform);
    let removed = 0;

    if (fse.existsSync(localesPath)) {
      const localeDirs = fse
        .readdirSync(localesPath)
        .filter(f => f.endsWith(`.${getLanguageFileExtension(platform)}`));

      localeDirs.forEach(localeDir => {
        const fileName = path
          .basename(localeDir, `.${getLanguageFileExtension(platform)}`);

        if (!pkg.build.electronLanguages!.includes(fileName)) {
          const fullPath = path.join(localesPath, localeDir);
          fse.removeSync(fullPath);
          removed += 1;
        }
      });

      log(`Removed ${removed}/${localeDirs.length} locale directories.`);
    }

    const frameworkLocalesPath = getElectronLanguageFolderPath(
      buildPath,
      platform
    );
    let frameworkRemoved = 0;

    if (fse.existsSync(frameworkLocalesPath)) {
      const frameworkLocaleDirs = fse
        .readdirSync(frameworkLocalesPath)
        .filter(f => f.endsWith(`.${getLanguageFileExtension(platform)}`));

      frameworkLocaleDirs.forEach(localeDir => {
        const fileName = path
          .basename(localeDir, `.${getLanguageFileExtension(platform)}`);

        if (!pkg.build.electronLanguages!.includes(fileName)) {
          const fullPath = path.join(frameworkLocalesPath, localeDir);
          fse.removeSync(fullPath);
          frameworkRemoved += 1;
        }
      });

      log(`Removed ${frameworkRemoved}/${frameworkLocaleDirs.length} ` +
        `locale directories from Electron Framework.`);
    }
  }

  next(null);
}
