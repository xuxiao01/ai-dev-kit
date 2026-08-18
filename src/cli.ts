import { Command } from 'commander';
import pc from 'picocolors';
import { createCursorCommand } from './commands/cursor.js';
import { createCodexCommand } from './commands/codex.js';
import { getPackageRoot } from './utils/path.js';

const program = new Command();
const packageRoot = getPackageRoot(import.meta.url);

program
  .name('ai-dev-kit')
  .description('Install AI development helper resources into your project.')
  .version('0.2.0')
  .showHelpAfterError()
  .showSuggestionAfterError();

program.addCommand(createCursorCommand({ packageRoot }));
program.addCommand(createCodexCommand({ packageRoot }));

program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error) {
  if (error instanceof Error) {
    console.error(pc.red(error.message));
  }
  process.exit(1);
}
