import path from 'node:path';

import type { IpcMainInvokeEvent } from 'electron';
import Handlebars from 'handlebars';
import fse from 'fs-extra';

import type { Build, GameMenuChoice } from '../../../types';
import { getBuildDir, sendLog, sendSuccessLog, toSlug } from './utils';
import { getResourcesDir } from '../../utils';

export const setupHandlebars = async () => {
  // Add helpers
  Handlebars.registerHelper('ensureArray', value => [].concat(value || []));
  Handlebars.registerHelper('hasItems', (arr: any[]) =>
    Array.isArray(arr) && arr.length > 0);
  Handlebars.registerHelper('slug', (str: string) => toSlug(str));
  Handlebars.registerHelper('int', (v: any) => parseInt(v, 10) || 0);
  Handlebars.registerHelper('bool', (v: any) =>
    typeof v === 'string' ? v === 'true' : !!v);
  Handlebars.registerHelper('eq', (a, b) => a === b);
  Handlebars.registerHelper('gt', (a, b) => a > b);
  Handlebars.registerHelper('lt', (a, b) => a < b);
  Handlebars.registerHelper('gte', (a, b) => a >= b);
  Handlebars.registerHelper('lte', (a, b) => a <= b);
  Handlebars.registerHelper('ne', (a, b) => a !== b);
  Handlebars.registerHelper('not', (a, b) => a !== b);
  Handlebars.registerHelper('neq', (a, b) => a !== b);
  Handlebars.registerHelper('isset', v => !!v);
  Handlebars.registerHelper('multiply', (a, b) => a * b);
  Handlebars.registerHelper('or', (a, b) => a || b);
  Handlebars.registerHelper('len', (a: string | any[]) => a.length);
  Handlebars.registerHelper('entries', obj => Object.entries(obj));
  Handlebars.registerHelper('concat', (...args) => args.slice(0, -1).join(''));
  Handlebars.registerHelper('uppercase', (str: string) => str.toUpperCase());
  Handlebars.registerHelper('log', (msg: any) => {
    // eslint-disable-next-line no-console
    console.log('[templates]', msg);

    return '';
  });
  Handlebars.registerHelper('powerOfTwo', (v: number) =>
    v % 2 === 0 ? v : v + 1);
  Handlebars.registerHelper('valuesCount', (arr: any[]) =>
    arr.reduce((c, i) => c + i.values.length, 0));
  Handlebars.registerHelper('size', (obj: any) =>
    Array.isArray(obj) ? obj.length : Object.keys(obj).length);
  Handlebars.registerHelper('getVariable', (variables: any[], id: string) => {
    return variables.flatMap(v => v.values)
      .find(v => v.id === id || v.name === id);
  });
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
};

export const compileTemplate = async (
  content: string,
  data: any,
): Promise<string> => {
  await setupHandlebars();
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
