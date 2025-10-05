import fs from 'node:fs/promises';
import path from 'node:path';

import Handlebars from 'handlebars';
import slugify from 'slugify';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export const buildTemplate = async (
  templateName: string,
  data: any = {},
  output: string = '../build',
) => {
  const template = await fs.readFile(path.join(
    __dirname, '../templates', `${templateName}.tpl.h`), 'utf-8');
  const outputDir = path.join(__dirname, output);

  Handlebars.registerHelper('ensureArray', value => [].concat(value || []));
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
  Handlebars.registerHelper('concat', (...args) => args.slice(0, -1).join(''));
  Handlebars.registerHelper('uppercase', (str: string) => str.toUpperCase());
  Handlebars.registerHelper('isRawValue', (obj: any) =>
    ['string', 'number', 'boolean'].includes(typeof obj));
  Handlebars.registerHelper('preserveLineBreaks', (str: string) =>
    str.replace(/\n/g, '\\n'));
  Handlebars.registerHelper('valuedef', (trueValue, falseValue) =>
    typeof trueValue !== 'undefined' && trueValue !== null
      ? trueValue : falseValue);

  Handlebars.registerPartial(
    'eventsPartial',
    (await fs.readFile(path.join(
      __dirname, '../templates/partials/events.tpl.h'), 'utf-8')).trim(),
  );

  Handlebars.registerPartial(
    'ifConditionsPartial',
    (await fs.readFile(path.join(
      __dirname, '../templates/partials/if-conditions.tpl.h'), 'utf-8')).trim()
  );

  Handlebars.registerPartial(
    'ifExpressionsPartial',
    (await fs.readFile(path.join(
      __dirname, '../templates/partials/if-expressions.tpl.h'), 'utf-8')).trim()
  );

  const compiled = Handlebars.compile(template, {
    noEscape: true,
  });
  const result = compiled(data);

  try {
    await fs.access(outputDir);
  } catch {
    await fs.mkdir(outputDir);
  }

  await fs.writeFile(path.join(outputDir, `${templateName}.h`), result);
};

export const toSlug = (str: string) => slugify(str, {
  lower: true,
  strict: true,
  replacement: '_',
});
