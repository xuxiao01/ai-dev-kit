import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(packageRoot, 'bin', 'ai-dev-kit.js');
const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'codex/packs/multi-agent-investment/manifest.json'), 'utf8'));

function temporaryProject(t) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-dev-kit-pack-'));
  t.after(() => fs.rmSync(project, { recursive: true, force: true }));
  return project;
}

function run(args, cwd, entry = cli) {
  return spawnSync(process.execPath, [entry, ...args], { cwd, encoding: 'utf8' });
}

function skillPath(project, name, relative = 'SKILL.md') {
  return path.join(project, '.agents', 'skills', name, relative);
}

test('the bundle installs five complete skills and preserves AGENTS.md content', (t) => {
  const project = temporaryProject(t);
  fs.writeFileSync(path.join(project, 'AGENTS.md'), '# Team instructions\n\nKeep this line.\n');

  const result = run(['codex', 'add', '--multi-agent-investment'], project);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(manifest.skills.length, 5);

  for (const skill of manifest.skills) {
    for (const relative of skill.files) {
      assert.equal(fs.readFileSync(skillPath(project, skill.name, relative), 'utf8'),
        fs.readFileSync(path.join(packageRoot, skill.source, relative), 'utf8'));
    }
  }

  const installed = fs.readdirSync(path.join(project, '.agents', 'skills')).sort();
  assert.deepEqual(installed, manifest.skills.map(({ name }) => name).sort());
  const agents = fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8');
  assert.match(agents, /Keep this line\./);
  for (const { name } of manifest.skills) assert.ok(agents.includes(`.agents/skills/${name}/SKILL.md`));
});

test('existing skills are skipped by default and overwritten with --force', (t) => {
  const project = temporaryProject(t);
  assert.equal(run(['codex', 'add', '--multi-agent-investment'], project).status, 0);
  const target = skillPath(project, 'project-ui-style');
  fs.writeFileSync(target, 'local change\n');

  const skipped = run(['codex', 'add', '--multi-agent-investment'], project);
  assert.equal(skipped.status, 0, skipped.stderr);
  assert.equal(fs.readFileSync(target, 'utf8'), 'local change\n');

  const overwritten = run(['codex', 'add', '--multi-agent-investment', '--force'], project);
  assert.equal(overwritten.status, 0, overwritten.stderr);
  assert.equal(fs.readFileSync(target, 'utf8'),
    fs.readFileSync(path.join(packageRoot, 'codex/packs/multi-agent-investment/skills/project-ui-style/SKILL.md'), 'utf8'));
});

test('invalid bundle arguments are rejected before project files are changed', (t) => {
  const project = temporaryProject(t);
  for (const args of [
    ['codex', 'add', '--multi-agent-investment', '--all'],
    ['codex', 'add', 'skill', '--multi-agent-investment'],
    ['codex', 'add', 'skill', 'project-ui-style', '--multi-agent-investment']
  ]) {
    const result = run(args, project);
    assert.notEqual(result.status, 0, args.join(' '));
    assert.equal(fs.existsSync(path.join(project, '.agents')), false);
    assert.equal(fs.existsSync(path.join(project, 'AGENTS.md')), false);
  }
});

test('a damaged managed index is rejected before any skill is copied', (t) => {
  const project = temporaryProject(t);
  fs.writeFileSync(path.join(project, 'AGENTS.md'), '<!-- ai-dev-kit:codex-skills:start -->\n');
  const result = run(['codex', 'add', '--multi-agent-investment'], project);
  assert.notEqual(result.status, 0);
  assert.equal(fs.existsSync(path.join(project, '.agents')), false);
  assert.equal(fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8'), '<!-- ai-dev-kit:codex-skills:start -->\n');
});

test('a missing packaged reference is rejected before any skill is copied', (t) => {
  const project = temporaryProject(t);
  const fixture = temporaryProject(t);
  const fixtureCli = path.join(fixture, 'bin', 'ai-dev-kit.js');
  fs.mkdirSync(path.dirname(fixtureCli), { recursive: true });
  fs.copyFileSync(cli, fixtureCli);
  fs.symlinkSync(path.join(packageRoot, 'node_modules'), path.join(fixture, 'node_modules'), 'dir');
  fs.cpSync(path.join(packageRoot, 'codex'), path.join(fixture, 'codex'), { recursive: true });
  fs.rmSync(path.join(fixture, 'codex/packs/multi-agent-investment/skills/project-ui-style/references/page-patterns.md'));

  const result = run(['codex', 'add', '--multi-agent-investment'], project, fixtureCli);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /project-ui-style\/references\/page-patterns\.md/);
  assert.equal(fs.existsSync(path.join(project, '.agents')), false);
});

test('generic --all and the Cursor command remain separate from the bundle', (t) => {
  const project = temporaryProject(t);
  const listed = run(['codex', 'list'], project);
  assert.equal(listed.status, 0, listed.stderr);
  assert.match(listed.stdout, /Optional skill pack: multi-agent-investment/);
  const installed = run(['codex', 'add', '--all'], project);
  assert.equal(installed.status, 0, installed.stderr);
  assert.equal(fs.readdirSync(path.join(project, '.agents', 'skills')).length, 8);
  assert.equal(fs.existsSync(skillPath(project, 'git-submit')), true);
  assert.equal(fs.existsSync(skillPath(project, 'draw')), true);
  assert.equal(fs.existsSync(skillPath(project, 'staged-change-report')), false);
  assert.equal(fs.existsSync(skillPath(project, 'project-ui-style')), false);
  assert.equal(fs.existsSync(skillPath(project, 'project-verification')), false);
  assert.equal(run(['cursor', 'list'], project).status, 0);
});
