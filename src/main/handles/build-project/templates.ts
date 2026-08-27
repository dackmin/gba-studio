import path from 'node:path';

import type { IpcMainInvokeEvent } from 'electron';
import Handlebars from 'handlebars';
import fse from 'fs-extra';

import type { Build, GameBackgroundFile, GameMenuChoice, GameVariables } from '../../../types';
import { getBuildDir, sendLog, sendSuccessLog, toSlug } from './utils';
import { getResourcesDir } from '../../utils';
import { findBackground, findSound, findSprite } from '../../../helpers';

export const setupHandlebars = async () => {
  // Add helpers
  Handlebars.registerHelper('ensureArray', value => [].concat(value || []));
  Handlebars.registerHelper('hasItems', (arr: any[]) =>
    Array.isArray(arr) && arr.length > 0);
  Handlebars.registerHelper('slug', (str: string) => toSlug(str || ''));
  Handlebars.registerHelper('int', (v: any) => parseInt(v, 10) || 0);
  Handlebars.registerHelper('isInt', (v: any) => Number.isInteger(parseInt(v, 10)));
  Handlebars.registerHelper('bool', (v: any) =>
    typeof v === 'string' ? v === 'true' : !!v);
  Handlebars.registerHelper('isBool', (v: any) =>
    typeof v === 'boolean' || ['true', 'false'].includes(v));
  Handlebars.registerHelper('contains', (arr: any[], value: any) => arr.includes(value));
  Handlebars.registerHelper('eq', (a, b) => a === b);
  Handlebars.registerHelper('gt', (a, b) => a > b);
  Handlebars.registerHelper('lt', (a, b) => a < b);
  Handlebars.registerHelper('gte', (a, b) => a >= b);
  Handlebars.registerHelper('lte', (a, b) => a <= b);
  Handlebars.registerHelper('ne', (a, b) => a !== b);
  Handlebars.registerHelper('not', (a, b) => a !== b);
  Handlebars.registerHelper('neq', (a, b) => a !== b);
  Handlebars.registerHelper('isset', v => !!v);
  Handlebars.registerHelper('add', (a, b) => a + b);
  Handlebars.registerHelper('multiply', (a, b) => a * b);
  Handlebars.registerHelper('divide', (a, b) => a / b);
  Handlebars.registerHelper('max', (...args) => Math.max(...args.slice(0, -1)));
  Handlebars.registerHelper('min', (...args) => Math.min(...args.slice(0, -1)));
  Handlebars.registerHelper('or', (...args) => args.slice(0, -1).some(Boolean));
  Handlebars.registerHelper('and', (...args) => args.slice(0, -1).every(Boolean));
  Handlebars.registerHelper('len', (a: string | any[]) => a.length);
  Handlebars.registerHelper('entries', obj => Object.entries(obj));
  Handlebars.registerHelper('concat', (...args) => args.slice(0, -1).join(''));
  Handlebars.registerHelper('uppercase', (str: string) => str.toUpperCase());
  Handlebars.registerHelper('log', (...args) => {
    // eslint-disable-next-line no-console
    console.log('[templates]', ...args.slice(0, -1));

    return '';
  });
  Handlebars.registerHelper('powerOfTwo', (v: number) =>
    v % 2 === 0 ? v : v + 1);
  Handlebars.registerHelper('valuesCount', (arr: any[]) =>
    arr.reduce((c, i) => c + i.values.length, 0));
  Handlebars.registerHelper('size', (obj: any) =>
    Array.isArray(obj) ? obj.length : Object.keys(obj).length);
  Handlebars.registerHelper('posix', (p: string) =>
    p.replace(/\s/g, '\\ ').replace(/\\/g, '/'));
  Handlebars.registerHelper('isRawValue', (obj: any) =>
    ['string', 'number', 'boolean'].includes(typeof obj));
  Handlebars.registerHelper('preserveLineBreaks', (str: string) =>
    str.replace(/\n/g, '\\n'));
  Handlebars.registerHelper('maxLen', (str: string | string[], len: number) =>
    Array.isArray(str) ? str.map(s => s.slice(0, len)) : str.slice(0, len));
  Handlebars.registerHelper('truncate', (str: string, len: number) =>
    str
      .split(/\r?\n/)
      .flatMap(line => line.match(new RegExp(`.{1,${len}}`, 'g')) || [''])
  );
  Handlebars.registerHelper('valuedef', (trueValue, falseValue) =>
    typeof trueValue !== 'undefined' && trueValue !== null && trueValue !== ''
      ? trueValue : falseValue);
  Handlebars.registerHelper('longestMenuChoice', (arr: GameMenuChoice[]) =>
    arr.sort((a, b) => b.text.length - a.text.length)[0]?.text || '');
  Handlebars.registerHelper('array', (...args) => args.slice(0, -1));

  // Add content helpers
  Handlebars.registerHelper('getVariable', (variables: GameVariables[], id: string) => {
    return variables.flatMap(v => v.values)
      .find(v => v.id === id || v.name === id);
  });
  Handlebars.registerHelper('getBackgroundName', (
    backgrounds: GameBackgroundFile[],
    id: string,
  ) => findBackground(backgrounds, id)
    ?._file?.replace(/\.json$/, '').replace(/^background_/, '') || id);
  Handlebars.registerHelper('getSpriteName', (sprites: any[], id: string) => {
    return findSprite(sprites, id)
      ?._file?.replace(/\.json$/, '').replace(/^sprite_/, '') || id;
  });
  Handlebars.registerHelper('getSoundName', (sounds: any[], id: string) => {
    return findSound(sounds, id)
      ?._file?.replace(/\.json$/, '').replace(/^sound_/, '') || id;
  });
  Handlebars.registerHelper('getMusicName', (musics: any[], id: string) => {
    return findSound(musics, id)
      ?._file?.replace(/\.json$/, '').replace(/^music_/, '') || id;
  });

  // Add partials
  Handlebars.registerPartial(
    'eventsPartial',
    (await fse.readFile(path.join(
      getResourcesDir(),
      './public/templates/commons/templates/partials/events.tpl.h'), 'utf-8')
    ),
  );

  Handlebars.registerPartial(
    'ifConditionsPartial',
    (await fse.readFile(path.join(
      getResourcesDir(),
      './public/templates/commons/templates/partials/if-conditions.tpl.h'
    ), 'utf-8'))
  );

  Handlebars.registerPartial(
    'ifExpressionsPartial',
    (await fse.readFile(path.join(
      getResourcesDir(),
      './public/templates/commons/templates/partials/if-expressions.tpl.h'
    ), 'utf-8'))
  );

  Handlebars.registerPartial(
    'valuePartial',
    (await fse.readFile(path.join(
      getResourcesDir(),
      './public/templates/commons/templates/partials/value.tpl.h'
    ), 'utf-8'))
  );

  Handlebars.registerPartial(
    'animationsPartial',
    (await fse.readFile(path.join(
      getResourcesDir(),
      './public/templates/commons/templates/partials/animations.tpl.h'
    ), 'utf-8'))
  );
};

export const compileTemplate = async (
  content: string,
  data: any,
): Promise<string> => {
  const compiled = Handlebars.compile(content, {
    noEscape: true,
  });

  return compiled(data);
};

export const buildSingleTemplate = async (
  templateName: string,
  build: Build,
): Promise<void> => {
  const template = await fse.readFile(path.join(
    getResourcesDir(),
    './public/templates/commons/templates',
    templateName
  ), 'utf-8');

  const result = await compileTemplate(template, build.data);

  await fse.outputFile(
    path.join(getBuildDir(build), './build', templateName.replace('.tpl', '')),
    result,
    'utf-8',
  );
};

export const buildTemplates = async (
  event: IpcMainInvokeEvent,
  build: Build,
): Promise<void> => {
  await setupHandlebars();

  sendLog(event, build.id, 'Building helpers...');
  await buildSingleTemplate('neo_utils.tpl.h', build);
  sendSuccessLog(event, build.id, 'neo_utils.h built');

  sendLog(event, build.id, 'Building types...');
  await buildSingleTemplate('neo_types.tpl.h', build);
  sendSuccessLog(event, build.id, 'neo_types.h built');

  sendLog(event, build.id, 'Building variables...');
  await buildSingleTemplate('neo_variables.tpl.h', build);
  sendSuccessLog(event, build.id, 'neo_variables.h built');

  sendLog(event, build.id, 'Building scenes...');
  await buildSingleTemplate('neo_scenes.tpl.h', build);
  sendSuccessLog(event, build.id, 'neo_scenes.h built');
};
