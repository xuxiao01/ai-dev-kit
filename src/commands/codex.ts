import path from 'node:path';
import fs from 'fs-extra';
import { Command } from 'commander';
import pc from 'picocolors';
import { copyPathWithMode, listDirectoryNames, type CopyMode } from '../utils/file.js';

type CodexCommandContext = { packageRoot: string };
type AddOptions = { all?: boolean; force?: boolean };

const SKILL_INDEX_START = '<!-- ai-dev-kit:codex-skills:start -->';
const SKILL_INDEX_END = '<!-- ai-dev-kit:codex-skills:end -->';

const SKILL_DESCRIPTIONS: Record<string, string> = {
  'content-blog-optimize': '中文技术博客优化',
  'document-project-docs': '项目文档组织与维护',
  'document-project-readme': '项目 README 生成与维护',
  'engineering-bug-review': '工程问题复盘',
  'git-commit-staged': 'Git 暂存区提交',
  'vue-component-config': 'Vue 组件配置规范'
};

export function createCodexCommand(context: CodexCommandContext): Command {
  const codex = new Command('codex').description('Manage Codex skills for the current project.');

  codex.command('list').description('List built-in Codex skills.').action(async () => {
    const skills = await getCodexSkills(context.packageRoot);
    console.log(pc.bold('Codex Skills:'));
    printResourceList(skills);
  });

  codex
    .command('add')
    .description('Install Codex skills into the current project.')
    .argument('[type]', 'Resource type: skill')
    .argument('[name]', 'Skill name to install')
    .option('--all', 'Install all Codex skills')
    .option('--force', 'Overwrite an existing skill or replace the managed AGENTS.md index')
    .action(async (type: string | undefined, name: string | undefined, options: AddOptions) => {
      await handleAdd(context.packageRoot, type, name, options);
    });

  return codex;
}

async function handleAdd(
  packageRoot: string,
  rawType: string | undefined,
  name: string | undefined,
  options: AddOptions
): Promise<void> {
  const mode: CopyMode = options.force ? 'overwrite' : 'skip';
  const projectRoot = process.cwd();

  if (options.all) {
    if (name) throw new Error('Do not provide a skill name with --all. Use "codex add --all" or "codex add skill --all".');
    normalizeResourceType(rawType);
    const skills = await getCodexSkills(packageRoot);
    for (const skill of skills) await installSkill(packageRoot, projectRoot, skill, mode);
    return;
  }

  const type = normalizeResourceType(rawType);
  if (!type || !name) throw new Error('Missing arguments. Usage: ai-dev-kit codex add skill <name>, ai-dev-kit codex add skill --all, or ai-dev-kit codex add --all');

  const skills = await getCodexSkills(packageRoot);
  if (!skills.includes(name)) {
    throw new Error(`Unknown Codex skill: ${name}\nAvailable skills: ${formatAvailable(skills)}`);
  }

  await installSkill(packageRoot, projectRoot, name, mode);
}

async function installSkill(packageRoot: string, projectRoot: string, name: string, mode: CopyMode): Promise<void> {
  const targetPath = path.join('.agents', 'skills', name);
  const result = await copyPathWithMode(
    path.join(packageRoot, 'codex', 'skills', name),
    path.join(projectRoot, targetPath),
    mode
  );
  printCopyResult(targetPath, result);
  await updateSkillIndex(projectRoot, name);
}

async function updateSkillIndex(projectRoot: string, name: string): Promise<void> {
  const target = path.join(projectRoot, 'AGENTS.md');
  const existing = (await fs.pathExists(target)) ? await fs.readFile(target, 'utf8') : '';
  const startIndex = existing.indexOf(SKILL_INDEX_START);
  const names = new Set<string>();

  if (startIndex >= 0) {
    const endIndex = existing.indexOf(SKILL_INDEX_END, startIndex);
    if (endIndex < 0) throw new Error('Cannot update AGENTS.md: its managed Codex skill index is incomplete.');
    const managedBlock = existing.slice(startIndex, endIndex);
    for (const match of managedBlock.matchAll(/\.agents\/skills\/([a-z0-9-]+)\/SKILL\.md/g)) names.add(match[1]);
  }
  names.add(name);

  const block = [
    SKILL_INDEX_START,
    '',
    '## 可用项目 Skills',
    '',
    '涉及对应任务时，先阅读相关 Skill：',
    '',
    ...[...names].sort((a, b) => a.localeCompare(b)).map((skill) => `- ${SKILL_DESCRIPTIONS[skill] ?? skill}：.agents/skills/${skill}/SKILL.md`),
    '',
    SKILL_INDEX_END
  ].join('\n');

  if (startIndex >= 0) {
    const endIndex = existing.indexOf(SKILL_INDEX_END, startIndex);
    await fs.writeFile(target, `${existing.slice(0, startIndex)}${block}${existing.slice(endIndex + SKILL_INDEX_END.length)}`);
    return;
  }

  await fs.writeFile(target, existing.trimEnd() ? `${existing.trimEnd()}\n\n${block}\n` : `${block}\n`);
}

async function getCodexSkills(packageRoot: string): Promise<string[]> {
  return listDirectoryNames(path.join(packageRoot, 'codex', 'skills'), 'SKILL.md');
}

function normalizeResourceType(type: string | undefined): 'skill' {
  if (type === undefined || type === 'skill') return 'skill';
  throw new Error('Invalid resource type. Use "skill".');
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
