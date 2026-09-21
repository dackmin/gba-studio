import yargs from 'yargs';

import build from './commands/build';

await yargs(process.argv.slice(2))
  .scriptName('gba-studio')
  .usage('$0 <cmd> [args]')
  .command('build', 'Build the project', () => {}, build)
  .help()
  .parseAsync();
