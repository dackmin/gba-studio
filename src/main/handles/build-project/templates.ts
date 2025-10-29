import path from 'node:path';

import type { IpcMainInvokeEvent } from 'electron';
import Handlebars from 'handlebars';
import fse from 'fs-extra';

import type { Build } from '../../../types';
import { sendLog, sendSuccessLog, toSlug } from './utils';

export const buildSingleTemplate = async (
  templateName: string,
  build: Build,
): Promise<void> => {
  const projectDir = path.dirname(build.projectPath);
  const template = await fse.readFile(
    path.join(projectDir, './templates', templateName),
    'utf-8'
  );

  // Add helpers
  Handlebars.registerHelper('ensureArray', value => [].concat(value || []));
  Handlebars.registerHelper('hasItems', (arr: any[]) =>
    Array.isArray(arr) && arr.length > 0);
  Handlebars.registerHelper('slug', (str: string) => toSlug(str));
  Handlebars.registerHelper('eq', (a, b) => a === b);
  Handlebars.registerHelper('gt', (a, b) => a > b);
  Handlebars.registerHelper('lt', (a, b) => a < b);
  Handlebars.registerHelper('gte', (a, b) => a >= b);
  Handlebars.registerHelper('lte', (a, b) => a <= b);
  Handlebars.registerHelper('ne', (a, b) => a !== b);
  Handlebars.registerHelper('isset', v => !!v);
  Handlebars.registerHelper('multiply', (a, b) => a * b);
  Handlebars.registerHelper('or', (a, b) => a || b);
  Handlebars.registerHelper('entries', obj => Object.entries(obj));
  Handlebars.registerHelper('concat', (...args) => args.slice(0, -1).join(''));
  Handlebars.registerHelper('uppercase', (str: string) => str.toUpperCase());
  Handlebars.registerHelper('isRawValue', (obj: any) =>
    ['string', 'number', 'boolean'].includes(typeof obj));
  Handlebars.registerHelper('preserveLineBreaks', (str: string) =>
    str.replace(/\n/g, '\\n'));
  Handlebars.registerHelper('valuedef', (trueValue, falseValue) =>
    typeof trueValue !== 'undefined' && trueValue !== null
      ? trueValue : falseValue);

  // Add partials
  Handlebars.registerPartial(
    'eventsPartial',
    (await fse.readFile(path.join(
      projectDir, './templates/partials/events.tpl.h'), 'utf-8')
    ).trim(),
  );

  Handlebars.registerPartial(
    'ifConditionsPartial',
    (await fse.readFile(path.join(
      projectDir, './templates/partials/if-conditions.tpl.h'), 'utf-8')
    ).trim()
  );

  Handlebars.registerPartial(
    'ifExpressionsPartial',
    (await fse.readFile(path.join(
      projectDir, './templates/partials/if-expressions.tpl.h'), 'utf-8')
    ).trim()
  );

  const compiled = Handlebars.compile(template, {
    noEscape: true,
  });

  const result = compiled(build.data);

  await fse.writeFile(
    path.join(projectDir, './build', templateName.replace('.tpl', '')),
    result,
    'utf-8'
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
