import fs from 'node:fs/promises';
import path from 'node:path';

// import { Validator } from 'jsonschema';
import colors from 'colors/safe';

import { buildTemplate } from './utils';
// import sceneSchema from '../.schemas/scene.json';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const projectRoot = path.join(__dirname, '../');
const dataRoot = path.join(projectRoot, './data');

interface LoadedFile {
  name: string;
  content: any;
}

interface LoadedFiles {
  dataFiles: LoadedFile[];
  projectFile: LoadedFile;
}

const buildTypes = async () => {
  await buildTemplate('neo_types');

  // eslint-disable-next-line no-console
  console.log('Built neo_types.h');
};

const buildVariables = async (data: LoadedFiles) => {
  const variables: Record<string, any> = data.dataFiles
    .filter(f => f.name.startsWith('variables'))
    .reduce((acc, file) => {
      Object.entries(file.content.values).forEach(([key, value]) => {
        if (acc.find((v: any) => v.key === key)) {
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

const buildScenes = async (data: LoadedFiles) => {
  const scenes: Record<string, any> = {};
  // const validator = new Validator();

  for (const file of data.dataFiles.filter(f => f.name.startsWith('scene'))) {
    if (file.content.type === 'scene') {
      scenes[file.name] = file.content;

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

  const scripts: Record<string, any> = {};

  for (const file of data.dataFiles.filter(f => f.name.startsWith('script'))) {
    if (file.content.type === 'script') {
      scripts[file.name] = file.content;
    }
  }

  await buildTemplate('neo_scenes', {
    scenes: Object.values(scenes),
    scripts: Object.values(scripts),
    project: data.projectFile.content,
  });

  // eslint-disable-next-line no-console
  console.log('Built neo_scenes.h');
};

(async () => {
  // Load data files
  const dataFolder = await fs.readdir(dataRoot);
  const dataFiles = await Promise.all(dataFolder
    .filter(f => f.endsWith('.json'))
    .map(async f => ({
      name: f,
      content: JSON.parse(await fs.readFile(path.join(dataRoot, f), 'utf-8')),
    })));

  // Load project file
  const projectFolder = await fs.readdir(projectRoot);
  const projectFileName = projectFolder.find(f => f.endsWith('.gbasproj'));
  const projectFile = {
    name: projectFileName!,
    content: JSON.parse(
      await fs.readFile(
        path.join(projectRoot, projectFileName!),
        'utf-8'
      )
    ),
  };

  const data = { dataFiles, projectFile };

  await buildTypes();
  await buildVariables(data);
  await buildScenes(data);
})();
