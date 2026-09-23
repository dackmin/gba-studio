import yargs from 'yargs';

import build from './commands/build';

await yargs(process.argv.slice(2))
  .scriptName('gba-studio')
  .usage('$0 <cmd> [args]')
  .command('build', 'Build a GBA Studio project', {
    config: {
      type: 'string',
      alias: 'c',
      describe: 'Build configuration name',
      required: false,
    },
  }, argv => build({
    configurationName: argv.config,
  }))
  .demandCommand()
  .help()
  .parseAsync();
