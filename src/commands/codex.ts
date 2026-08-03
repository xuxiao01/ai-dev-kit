import path from 'node:path';
import fs from 'fs-extra';
import { Command } from 'commander';
import pc from 'picocolors';
import { copyPathWithMode, listDirectoryNames, listResourceNames, type CopyMode } from '../utils/file.js';

type CodexResourceType = 'rule' | 'skill';
type CodexCommandContext = { packageRoot: string };
type AddOptions = { all?: boolean; force?: boolean };

const RULE_START = '<!-- ai-dev-kit:codex-rule:';

export function createCodexCommand(context: CodexCommandContext): Command {
  const codex = new Command('codex').description('Manage Codex skills and project rules.');

  codex.command('list').description('List built-in Codex resources.').action(async () => {
    const resources = await getCodexResources(context.packageRoot);
    console.log(pc.bold('Codex Skills:'));
    printResourceList(resources.skill);
    console.log(pc.bold('Codex Rules:'));
    printResourceList(resources.rule);
  });

  codex
    .command('add')
    .description('Install Codex resources into the current project.')
    .argument('[type]', 'Resource type: skill or rule')
    .argument('[name]', 'Resource name to install')
    .option('--all', 'Install all Codex resources, or every resource of the specified type')
    .option('--force', 'Overwrite an existing skill or replace an installed rule block')
    .action(async (type: string | undefined, name: string | undefined, options: AddOptions) => {
      await handleAdd(context.packageRoot, type, name, options);
    });

  return codex;
}

async function handleAdd(packageRoot: string, rawType: string | undefined, name: string | undefined, options: AddOptions): Promise<void> {
  const mode: CopyMode = options.force ? 'overwrite' : 'skip';
  const projectRoot = process.cwd();

  if (options.all) {
    if (name) throw new Error('Do not provide a resource name with --all. Use "codex add --all" or "codex add <skill|rule> --all".');
    const type = normalizeResourceType(rawType);
    const resources = await getCodexResources(packageRoot);
    if (!type || type === 'skill') {
      for (const skill of resources.skill) await installSkill(packageRoot, projectRoot, skill, mode);
    }
    if (!type || type === 'rule') {
      for (const rule of resources.rule) await installRule(packageRoot, projectRoot, rule, mode);
    }
    return;
  }

  const type = normalizeResourceType(rawType);
  if (!type || !name) throw new Error('Missing arguments. Usage: ai-dev-kit codex add <skill|rule> <name>, ai-dev-kit codex add <skill|rule> --all, or ai-dev-kit codex add --all');

  const resources = await getCodexResources(packageRoot);
  if (!resources[type].includes(name)) {
    throw new Error(`Unknown Codex ${type}: ${name}\nAvailable ${type}s: ${formatAvailable(resources[type])}`);
  }

  if (type === 'skill') await installSkill(packageRoot, projectRoot, name, mode);
  else await installRule(packageRoot, projectRoot, name, mode);
}

async function installSkill(packageRoot: string, projectRoot: string, name: string, mode: CopyMode): Promise<void> {
  const targetPath = path.join('.agents', 'skills', name);
  const result = await copyPathWithMode(
    path.join(packageRoot, 'codex', 'skills', name),
    path.join(projectRoot, targetPath),
    mode
  );
  printCopyResult(targetPath, result);
}

async function installRule(packageRoot: string, projectRoot: string, name: string, mode: CopyMode): Promise<void> {
  const source = path.join(packageRoot, 'codex', 'rules', `${name}.md`);
  const rule = await fs.readFile(source, 'utf8');
  const target = path.join(projectRoot, 'AGENTS.md');
  const start = `${RULE_START}${name}:start -->`;
  const end = `<!-- ai-dev-kit:codex-rule:${name}:end -->`;
  const block = `${start}\n\n${rule.trim()}\n\n${end}`;
  const existing = (await fs.pathExists(target)) ? await fs.readFile(target, 'utf8') : '';
  const startIndex = existing.indexOf(start);

  if (startIndex >= 0) {
    if (mode === 'skip') {
      console.log(pc.yellow(`Skipped existing rule: AGENTS.md (${name})`));
      return;
    }
    const endIndex = existing.indexOf(end, startIndex);
    if (endIndex < 0) throw new Error(`Cannot replace ${name}: its managed block in AGENTS.md is incomplete.`);
    await fs.writeFile(target, `${existing.slice(0, startIndex)}${block}${existing.slice(endIndex + end.length)}`);
    console.log(pc.green(`Overwritten rule: AGENTS.md (${name})`));
    return;
  }

  await fs.writeFile(target, existing.trimEnd() ? `${existing.trimEnd()}\n\n${block}\n` : `${block}\n`);
  console.log(pc.green(`Installed rule: AGENTS.md (${name})`));
}

async function getCodexResources(packageRoot: string): Promise<Record<CodexResourceType, string[]>> {
  const [skills, rules] = await Promise.all([
    listDirectoryNames(path.join(packageRoot, 'codex', 'skills'), 'SKILL.md'),
    listResourceNames(path.join(packageRoot, 'codex', 'rules'), '.md')
  ]);
  return { skill: skills, rule: rules };
}

function normalizeResourceType(type: string | undefined): CodexResourceType | undefined {
  if (type === 'skill' || type === 'rule') return type;
  if (type) throw new Error('Invalid resource type. Use "skill" or "rule".');
  return undefined;
}

function printCopyResult(targetPath: string, result: 'installed' | 'skipped' | 'overwritten'): void {
  const label = result === 'installed' ? 'Installed' : result === 'overwritten' ? 'Overwritten' : 'Skipped existing file';
  const color = result === 'skipped' ? pc.yellow : pc.green;
  console.log(color(`${label}: ${targetPath}`));
}

function printResourceList(names: string[]): void {
  if (names.length === 0) console.log(pc.dim('- none'));
  else names.forEach((name) => console.log(`- ${name}`));
}

function formatAvailable(names: string[]): string { return names.length ? names.join(', ') : 'none'; }
