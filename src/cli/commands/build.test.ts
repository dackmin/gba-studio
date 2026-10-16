import path from 'node:path';
import fsp from 'node:fs/promises';

import build from './build';

const projectPath = path.resolve('tests/fixtures/basic-game/test.gbasproj');
const projectDir = path.dirname(projectPath);
const buildDir = path.resolve(projectDir, '.gbastudio/build');

const readBuiltFile = async (filename: string) => {
  return fsp.readFile(path.resolve(buildDir, filename), 'utf-8');
};

describe('cli/build', () => {
  it('should build a basic project successfully', { timeout: 30000 }, async () => {
    // @ts-expect-error Mock electron resourcesPath
    process.resourcesPath = path.resolve();

    await build({ projectPath });

    await expect(readBuiltFile('neo_scenes.h')).resolves.toMatchSnapshot();
    await expect(readBuiltFile('neo_types.h')).resolves.toMatchSnapshot();
    await expect(readBuiltFile('neo_variables.h')).resolves.toMatchSnapshot();
    await expect(readBuiltFile('neo_font.h')).resolves.toMatchSnapshot();
    await expect(readBuiltFile('neo_logs.h')).resolves.toMatchSnapshot();
    await expect(readBuiltFile('neo_utils.h')).resolves.toMatchSnapshot();
  });
});
