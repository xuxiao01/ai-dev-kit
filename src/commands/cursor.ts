import path from 'node:path';
import { Command } from 'commander';
import pc from 'picocolors';
import {
  copyFileWithMode,
  listResourceNames,
  type CopyMode
} from '../utils/file.js';

type CursorCommandContext = {
  packageRoot: string;
};

type CursorResourceType = 'rule' | 'command';

type AddOptions = {
  all?: boolean;
  force?: boolean;
};

type ResourceConfig = {
  label: string;
  sourceDir: string;
  targetDir: string;
  extension: string;
};

const RESOURCE_CONFIG: Record<CursorResourceType, ResourceConfig> = {
  rule: {
    label: 'rule',
    sourceDir: path.join('cursor', 'rules'),
    targetDir: path.join('.cursor', 'rules'),
    extension: '.mdc'
  },
  command: {
    label: 'command',
    sourceDir: path.join('cursor', 'commands'),
    targetDir: path.join('.cursor', 'commands'),
    extension: '.md'
  }
};

const RESOURCE_ORDER: Record<CursorResourceType, string[]> = {
  rule: ['vue3-typescript', 'h5-mobile-layout', 'ui-review'],
  command: ['generate-readme', 'review-ui', 'create-mini-game-doc']
};

export function createCursorCommand(context: CursorCommandContext): Command {
  const cursor = new Command('cursor').description('Manage Cursor rules and commands.');

  cursor
    .command('list')
    .description('List built-in Cursor resources.')
    .action(async () => {
      const resources = await getCursorResources(context.packageRoot);

      console.log(pc.bold('Cursor Rules:'));
      printResourceList(resources.rule);
      console.log(pc.bold('Cursor Commands:'));
      printResourceList(resources.command);
    });

  cursor
    .command('add')
    .description('Install Cursor resources into the current project.')
    .argument('[type]', 'Resource type: rule or command')
    .argument('[name]', 'Resource name to install')
    .option('--all', 'Install all Cursor rules and commands')
    .option('--force', 'Overwrite existing files')
    .action(async (type: string | undefined, name: string | undefined, options: AddOptions) => {
      await handleAdd(context.packageRoot, type, name, options);
    });

  return cursor;
}

async function handleAdd(
  packageRoot: string,
  rawType: string | undefined,
  name: string | undefined,
  options: AddOptions
): Promise<void> {
  const projectRoot = process.cwd();
  const mode: CopyMode = options.force ? 'overwrite' : 'skip';

  if (options.all) {
    if (rawType || name) {
      throw new Error('Use either "cursor add --all" or "cursor add <rule|command> <name>", not both.');
    }

    const resources = await getCursorResources(packageRoot);
    await installMany(packageRoot, projectRoot, 'rule', resources.rule, mode);
    await installMany(packageRoot, projectRoot, 'command', resources.command, mode);
    return;
  }

  const type = normalizeResourceType(rawType);

  if (!type || !name) {
    throw new Error('Missing arguments. Usage: ai-dev-kit cursor add <rule|command> <name> or ai-dev-kit cursor add --all');
  }

  const resources = await getCursorResources(packageRoot);
  const available = resources[type];

  if (!available.includes(name)) {
    throw new Error(
      [
        `Unknown Cursor ${RESOURCE_CONFIG[type].label}: ${name}`,
        `Available ${RESOURCE_CONFIG[type].label}s: ${formatAvailable(available)}`
      ].join('\n')
    );
  }

  await installOne(packageRoot, projectRoot, type, name, mode);
}

async function installMany(
  packageRoot: string,
  projectRoot: string,
  type: CursorResourceType,
  names: string[],
  mode: CopyMode
): Promise<void> {
  for (const name of names) {
    await installOne(packageRoot, projectRoot, type, name, mode);
  }
}

async function installOne(
  packageRoot: string,
  projectRoot: string,
  type: CursorResourceType,
  name: string,
  mode: CopyMode
): Promise<void> {
  const config = RESOURCE_CONFIG[type];
  const source = path.join(packageRoot, config.sourceDir, `${name}${config.extension}`);
  const target = path.join(projectRoot, config.targetDir, `${name}${config.extension}`);
  const displayPath = path.join(config.targetDir, `${name}${config.extension}`);
  const result = await copyFileWithMode(source, target, mode);

  if (result === 'skipped') {
    console.log(pc.yellow(`Skipped existing file: ${displayPath}`));
    return;
  }

  if (result === 'overwritten') {
    console.log(pc.green(`Overwritten: ${displayPath}`));
    return;
  }

  console.log(pc.green(`Installed: ${displayPath}`));
}

async function getCursorResources(packageRoot: string): Promise<Record<CursorResourceType, string[]>> {
  const [rules, commands] = await Promise.all([
    listResourceNames(path.join(packageRoot, RESOURCE_CONFIG.rule.sourceDir), RESOURCE_CONFIG.rule.extension),
    listResourceNames(path.join(packageRoot, RESOURCE_CONFIG.command.sourceDir), RESOURCE_CONFIG.command.extension)
  ]);

  return {
    rule: sortByPreferredOrder(rules, RESOURCE_ORDER.rule),
    command: sortByPreferredOrder(commands, RESOURCE_ORDER.command)
  };
}

function normalizeResourceType(type: string | undefined): CursorResourceType | undefined {
  if (type === 'rule' || type === 'command') {
    return type;
  }

  if (type) {
    throw new Error('Invalid resource type. Use "rule" or "command".');
  }

  return undefined;
}

function printResourceList(names: string[]): void {
  if (names.length === 0) {
    console.log(pc.dim('- none'));
    return;
  }

  for (const name of names) {
    console.log(`- ${name}`);
  }
}

function formatAvailable(names: string[]): string {
  return names.length > 0 ? names.join(', ') : 'none';
}

function sortByPreferredOrder(names: string[], preferredOrder: string[]): string[] {
  const preferred = names.filter((name) => preferredOrder.includes(name));
  const extra = names.filter((name) => !preferredOrder.includes(name));

  return [
    ...preferredOrder.filter((name) => preferred.includes(name)),
    ...extra
  ];
}
