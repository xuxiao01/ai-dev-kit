import path from 'node:path';
import fs from 'fs-extra';
import { Command } from 'commander';
import pc from 'picocolors';
import { copyPathWithMode, listDirectoryNames, type CopyMode } from '../utils/file.js';

type CodexCommandContext = { packageRoot: string };
type AddOptions = { all?: boolean; force?: boolean; multiAgentInvestment?: boolean };

const SKILL_INDEX_START = '<!-- ai-dev-kit:codex-skills:start -->';
const SKILL_INDEX_END = '<!-- ai-dev-kit:codex-skills:end -->';
const BLOG_RESOURCE_FILES = [
  'blog/SKILL.md',
  'blog/agents/openai.yaml',
  'draw/SKILL.md',
  'draw/agents/openai.yaml',
  'draw/scripts/export_drawio.py',
  'draw/references/diagram-styles.md',
  'draw/references/article-diagrams.md',
  'draw/references/ppt-and-exports.md',
  ...['network-layers', 'operator-flow', 'architecture', 'concurrent-save']
    .flatMap((name) => [`draw/assets/${name}.drawio`, `draw/assets/${name}.png`])
];
const RENAMED_SKILLS = new Map<string, string>([
  ['personal-branch-commit', 'git-submit'],
  ['git-commit-staged', 'git-commit'],
  ['content-blog-optimize', 'blog'],
  ['scientific-network-diagrams', 'draw'],
  ['document-project-docs', 'docs'],
  ['document-project-readme', 'readme'],
  ['engineering-bug-review', 'bug-review'],
  ['vue-component-config', 'vue-config']
]);
type PackSkill = { name: string; description: string; source: string; files: string[] };

async function getInvestmentPack(packageRoot: string): Promise<PackSkill[]> {
  const manifestPath = path.join(packageRoot, 'codex', 'packs', 'multi-agent-investment', 'manifest.json');
  const manifest = await fs.readJson(manifestPath) as { skills?: PackSkill[] };
  if (!Array.isArray(manifest.skills) || manifest.skills.length !== 5) throw new Error('Invalid multi-agent-investment pack manifest.');
  const expected = ['git-commit', 'docs', 'staged-change-report', 'project-ui-style', 'project-verification'];
  for (const [index, skill] of manifest.skills.entries()) {
    const source = index < 2 ? `codex/skills/${expected[index]}` : `codex/packs/multi-agent-investment/skills/${expected[index]}`;
    if (skill.name !== expected[index] || skill.source !== source || typeof skill.description !== 'string' || !skill.description.trim() || !Array.isArray(skill.files) || !skill.files.includes('SKILL.md') || !skill.files.includes('agents/openai.yaml') || skill.files.some((file) => typeof file !== 'string' || !file || file.includes('\\') || path.posix.isAbsolute(file) || file.split('/').includes('..'))) {
      throw new Error('Invalid multi-agent-investment pack manifest.');
    }
  }
  return manifest.skills;
}

const SKILL_DESCRIPTIONS: Record<string, string> = {
  'blog': '中文技术博客优化',
  'docs': '项目文档组织与维护',
  'readme': '项目 README 生成与维护',
  'bug-review': '工程问题复盘',
  'git-commit': 'Git 暂存区提交',
  'git-submit': '个人分支提交与同步',
  'draw': '科研与技术绘图',
  'staged-change-report': '暂存区修改报告',
  'project-ui-style': '投资平台 UI 风格',
  'project-verification': '投资平台验证与本地验收',
  'vue-config': 'Vue 组件配置规范'
};

export function createCodexCommand(context: CodexCommandContext): Command {
  const codex = new Command('codex').description('Manage Codex skills for the current project.');

  codex.command('list').description('List built-in Codex skills.').action(async () => {
    const skills = await getCodexSkills(context.packageRoot);
    console.log(pc.bold('Codex Skills:'));
    printResourceList(skills);
    console.log(pc.bold('\nOptional skill pack: multi-agent-investment'));
    const pack = await getInvestmentPack(context.packageRoot);
    pack.forEach(({ name, description }) => console.log(`- ${name}: ${description}`));
  });

  codex
    .command('add')
    .description('Install Codex skills into the current project.')
    .argument('[type]', 'Resource type: skill')
    .argument('[name]', 'Skill name to install')
    .option('--all', 'Install all Codex skills')
    .option('--multi-agent-investment', 'Install the multi-agent-investment skill pack')
    .option('--force', 'Overwrite existing skill files (the managed AGENTS.md index is always updated)')
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

  if (options.multiAgentInvestment) {
    if (options.all || rawType || name) throw new Error('Use --multi-agent-investment by itself, with optional --force.');
    await validateSkillPack(packageRoot, projectRoot);
    const pack = await getInvestmentPack(packageRoot);
    for (const skill of pack) SKILL_DESCRIPTIONS[skill.name] = skill.description;
    for (const skill of pack) await installSkill(packageRoot, projectRoot, skill.name, mode, skill.source);
    return;
  }

  if (options.all) {
    if (name) throw new Error('Do not provide a skill name with --all. Use "codex add --all" or "codex add skill --all".');
    normalizeResourceType(rawType);
    const skills = await getCodexSkills(packageRoot);
    if (skills.includes('blog')) await validateBlogInstallation(packageRoot, projectRoot);
    const installationOrder = skills.includes('blog')
      ? ['draw', ...skills.filter((skill) => skill !== 'draw')]
      : skills;
    for (const skill of installationOrder) await installSkill(packageRoot, projectRoot, skill, mode);
    return;
  }

  const type = normalizeResourceType(rawType);
  if (!type || !name) throw new Error('Missing arguments. Usage: ai-dev-kit codex add skill <name>, ai-dev-kit codex add skill --all, or ai-dev-kit codex add --all');

  const skills = await getCodexSkills(packageRoot);
  if (!skills.includes(name)) {
    const renamedTo = RENAMED_SKILLS.get(name);
    if (renamedTo) {
      throw new Error(`Codex skill "${name}" was renamed to "${renamedTo}". Use "ai-dev-kit codex add skill ${renamedTo}".`);
    }
    throw new Error(`Unknown Codex skill: ${name}\nAvailable skills: ${formatAvailable(skills)}`);
  }

  if (name === 'blog') {
    await validateBlogInstallation(packageRoot, projectRoot);
    await installSkill(packageRoot, projectRoot, 'draw', mode);
  }
  await installSkill(packageRoot, projectRoot, name, mode);
}

async function validateBlogInstallation(packageRoot: string, projectRoot: string): Promise<void> {
  const missing: string[] = [];
  for (const file of BLOG_RESOURCE_FILES) {
    const stat = await fs.stat(path.join(packageRoot, 'codex', 'skills', file)).catch(() => undefined);
    if (!stat?.isFile()) missing.push(file);
  }
  if (missing.length) throw new Error(`Cannot install blog with draw; incomplete resources: ${missing.join(', ')}`);
  await validateSkillIndex(projectRoot);
}

async function installSkill(packageRoot: string, projectRoot: string, name: string, mode: CopyMode, sourcePath?: string): Promise<void> {
  const targetPath = path.join('.agents', 'skills', name);
  const result = await copyPathWithMode(
    path.join(packageRoot, sourcePath ?? path.join('codex', 'skills', name)),
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

async function validateSkillPack(packageRoot: string, projectRoot: string): Promise<void> {
  const pack = await getInvestmentPack(packageRoot);
  const missing: string[] = [];
  for (const skill of pack) {
    const source = path.join(packageRoot, skill.source);
    for (const file of skill.files) {
      const stat = await fs.stat(path.join(source, file)).catch(() => undefined);
      if (!stat?.isFile()) missing.push(`${skill.name}/${file}`);
    }
  }
  await validateSkillIndex(projectRoot);
  if (missing.length) throw new Error(`Cannot install multi-agent-investment pack; incomplete resources: ${missing.join(', ')}`);
}

async function validateSkillIndex(projectRoot: string): Promise<void> {
  const agentsPath = path.join(projectRoot, 'AGENTS.md');
  if (await fs.pathExists(agentsPath)) {
    const existing = await fs.readFile(agentsPath, 'utf8');
    const start = existing.indexOf(SKILL_INDEX_START);
    const end = existing.indexOf(SKILL_INDEX_END);
    if ((start >= 0) !== (end >= 0) || (start >= 0 && (end < start || existing.indexOf(SKILL_INDEX_START, start + SKILL_INDEX_START.length) >= 0 || existing.indexOf(SKILL_INDEX_END, end + SKILL_INDEX_END.length) >= 0))) {
      throw new Error('Cannot update AGENTS.md: its managed Codex skill index is invalid.');
    }
  }
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
