import fs from 'node:fs/promises';
import path from 'node:path';

// import { Validator } from 'jsonschema';
import colors from 'colors/safe';

import { buildTemplate } from './utils';
// import sceneSchema from '../.schemas/scene.json';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const dataRoot = path.join(__dirname, '../data');

const buildTypes = async () => {
  await buildTemplate('neo_types');

  // eslint-disable-next-line no-console
  console.log('Built neo_types.h');
};

const buildVariables = async () => {
  const dataFolder = await fs.readdir(dataRoot);
  const variables: Record<string, any> = (await Promise.all(dataFolder
    .filter(f => f.startsWith('variables'))
    .map(f => fs.readFile(path.join(dataRoot, f), 'utf-8'))))
    .reduce((acc, file) => {
      const content = JSON.parse(file);

      Object.entries(content.values).forEach(([key, value]) => {
        if (acc.find(v => v.key === key)) {
          console.warn(colors.yellow(`Duplicate variable key found: ${key}`));
        }

        acc.push({ key, value });
      });

      return acc;
    }, [] as { key: string, value: any }[]);

  await buildTemplate('neo_variables', {
    variables,
  });

  // eslint-disable-next-line no-console
  console.log('Built neo_variables.h');
};

const buildScenes = async () => {
  const dataFolder = await fs.readdir(dataRoot);
  const scenes: Record<string, any> = {};
  // const validator = new Validator();

  for (const file of dataFolder.filter(f => f.startsWith('scene'))) {
    const filename = path.basename(file, '.json');
    const content = JSON.parse(
      await fs.readFile(path.join(dataRoot, file), 'utf-8')
    );

    if (content.type === 'scene') {
      scenes[filename] = content;

      try {
        const mapFileName = `${filename}.map.json`;
        await fs.access(path.join(dataRoot, mapFileName));

        const mapData = JSON.parse(
          await fs.readFile(path.join(dataRoot, mapFileName), 'utf-8')
        );

        content.map = mapData;
      } catch {}

      // const { valid, errors } = validator.validate(content, sceneSchema);

      // if (!valid) {
      //   console.error(colors.red(
      //     `Validation errors found in ${file}: ` +
      //       JSON.stringify(errors, null, 2)
      //   ));
      //   process.exit(1);
      // }
    }
  }

  await buildTemplate('neo_scenes', {
    scenes: Object.values(scenes),
  });

  // eslint-disable-next-line no-console
  console.log('Built neo_scenes.h');
};

(async () => {
  await buildTypes();
  await buildVariables();
  await buildScenes();
})();
