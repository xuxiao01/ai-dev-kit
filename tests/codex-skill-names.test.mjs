import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(packageRoot, 'bin', 'ai-dev-kit.js');
const renamedSkills = [
  ['personal-branch-commit', 'git-submit'],
  ['git-commit-staged', 'git-commit'],
  ['content-blog-optimize', 'blog'],
  ['scientific-network-diagrams', 'draw'],
  ['document-project-docs', 'docs'],
  ['document-project-readme', 'readme'],
  ['engineering-bug-review', 'bug-review'],
  ['vue-component-config', 'vue-config']
];

function temporaryProject(t) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-dev-kit-short-names-'));
  t.after(() => fs.rmSync(project, { recursive: true, force: true }));
  return project;
}

function run(args, cwd) {
  return spawnSync(process.execPath, [cli, 'codex', ...args], { cwd, encoding: 'utf8' });
}

test('all eight short names can be listed and installed individually', (t) => {
  const project = temporaryProject(t);
  const expected = renamedSkills.map(([, name]) => name).sort();
  const listed = run(['list'], project);
  assert.equal(listed.status, 0, listed.stderr);
  const names = [...listed.stdout.split('Optional skill pack:')[0].matchAll(/^- (.+)$/gm)]
    .map((match) => match[1]).sort();
  assert.deepEqual(names, expected);

  for (const name of expected) {
    const installed = run(['add', 'skill', name], project);
    assert.equal(installed.status, 0, installed.stderr);
    const target = path.join(project, '.agents', 'skills', name);
    const skill = fs.readFileSync(path.join(target, 'SKILL.md'), 'utf8');
    assert.equal(skill.match(/^name: (.+)$/m)?.[1], name);
    assert.equal(skill,
      fs.readFileSync(path.join(packageRoot, 'codex', 'skills', name, 'SKILL.md'), 'utf8'));
    assert.ok(fs.readFileSync(path.join(target, 'agents', 'openai.yaml'), 'utf8').includes(`$${name}`));
  }
  assert.deepEqual(fs.readdirSync(path.join(project, '.agents', 'skills')).sort(), expected);
  const agents = fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8');
  for (const name of expected) assert.ok(agents.includes(`.agents/skills/${name}/SKILL.md`));
});

test('old installation names give their replacements before any project files are written', (t) => {
  for (const [oldName, newName] of renamedSkills) {
    const project = temporaryProject(t);
    const original = '# Existing project instructions\n';
    fs.writeFileSync(path.join(project, 'AGENTS.md'), original);
    const rejected = run(['add', 'skill', oldName], project);
    assert.notEqual(rejected.status, 0, oldName);
    assert.ok(rejected.stderr.includes(`ai-dev-kit codex add skill ${newName}`), rejected.stderr);
    assert.deepEqual(fs.readdirSync(project), ['AGENTS.md']);
    assert.equal(fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8'), original);
  }
});
