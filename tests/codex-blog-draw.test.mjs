import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(packageRoot, 'bin', 'ai-dev-kit.js');

function temporaryProject(t) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-dev-kit-blog-draw-'));
  t.after(() => fs.rmSync(project, { recursive: true, force: true }));
  return project;
}

function run(args, cwd, entry = cli) {
  return spawnSync(process.execPath, [entry, 'codex', ...args], { cwd, encoding: 'utf8' });
}

function skillPath(project, name, file) {
  return path.join(project, '.agents', 'skills', name, file);
}

function assertDirectoryCopy(source, destination) {
  assert.deepEqual(fs.readdirSync(destination).sort(), fs.readdirSync(source).sort());
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const original = path.join(source, entry.name);
    const copied = path.join(destination, entry.name);
    if (entry.isDirectory()) assertDirectoryCopy(original, copied);
    else assert.deepEqual(fs.readFileSync(copied), fs.readFileSync(original), copied);
  }
}

test('installing blog copies draw and indexes both skills', (t) => {
  const project = temporaryProject(t);
  fs.writeFileSync(path.join(project, 'AGENTS.md'), '# Team rules\n\nKeep this text.\n');
  const installed = run(['add', 'skill', 'blog'], project);
  assert.equal(installed.status, 0, installed.stderr);
  assert.deepEqual(fs.readdirSync(path.join(project, '.agents', 'skills')).sort(), ['blog', 'draw']);
  for (const name of ['blog', 'draw']) {
    assertDirectoryCopy(path.join(packageRoot, 'codex', 'skills', name), skillPath(project, name, ''));
  }
  const agents = fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8');
  assert.match(agents, /Keep this text\./);
  for (const name of ['blog', 'draw']) assert.ok(agents.includes(`.agents/skills/${name}/SKILL.md`));
});

test('blog respects existing draw customizations and --force merges packaged resources', (t) => {
  const project = temporaryProject(t);
  assert.equal(run(['add', 'skill', 'draw'], project).status, 0);
  const customized = skillPath(project, 'draw', 'SKILL.md');
  const extra = skillPath(project, 'draw', 'custom.txt');
  fs.writeFileSync(customized, 'custom drawing conventions\n');
  fs.writeFileSync(extra, 'project resource\n');

  const skipped = run(['add', 'skill', 'blog'], project);
  assert.equal(skipped.status, 0, skipped.stderr);
  assert.equal(fs.readFileSync(customized, 'utf8'), 'custom drawing conventions\n');
  assert.ok(fs.existsSync(skillPath(project, 'blog', 'SKILL.md')));

  const forced = run(['add', 'skill', 'blog', '--force'], project);
  assert.equal(forced.status, 0, forced.stderr);
  assert.equal(fs.readFileSync(customized, 'utf8'),
    fs.readFileSync(path.join(packageRoot, 'codex/skills/draw/SKILL.md'), 'utf8'));
  assert.equal(fs.readFileSync(extra, 'utf8'), 'project resource\n');
});

test('all installs draw before blog and copies each generic skill once', (t) => {
  for (const args of [['add', '--all'], ['add', 'skill', '--all']]) {
    const project = temporaryProject(t);
    const result = run(args, project);
    assert.equal(result.status, 0, result.stderr);
    const copied = [...result.stdout.matchAll(/Installed: \.agents\/skills\/([^\s]+)/g)]
      .map((match) => match[1]);
    assert.equal(copied.length, 8);
    assert.equal(new Set(copied).size, 8);
    assert.equal(copied[0], 'draw');
    assert.equal(fs.readdirSync(path.join(project, '.agents', 'skills')).length, 8);
  }
});

test('missing blog or draw resources reject installation before any project writes', (t) => {
  for (const missing of ['blog/agents/openai.yaml', 'draw/SKILL.md',
    'draw/scripts/export_drawio.py', 'draw/references/article-diagrams.md', 'draw/assets/architecture.png']) {
    const fixture = temporaryProject(t);
    const fixtureCli = path.join(fixture, 'bin', 'ai-dev-kit.js');
    fs.mkdirSync(path.dirname(fixtureCli), { recursive: true });
    fs.copyFileSync(cli, fixtureCli);
    fs.symlinkSync(path.join(packageRoot, 'node_modules'), path.join(fixture, 'node_modules'), 'dir');
    fs.cpSync(path.join(packageRoot, 'codex'), path.join(fixture, 'codex'), { recursive: true });
    fs.rmSync(path.join(fixture, 'codex', 'skills', missing));

    for (const args of [['add', 'skill', 'blog'], ['add', '--all']]) {
      const project = temporaryProject(t);
      const original = '# Existing instructions\n';
      fs.writeFileSync(path.join(project, 'AGENTS.md'), original);
      const rejected = run(args, project, fixtureCli);
      assert.notEqual(rejected.status, 0, missing);
      assert.ok(rejected.stderr.includes(missing), rejected.stderr);
      assert.deepEqual(fs.readdirSync(project), ['AGENTS.md']);
      assert.equal(fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8'), original);
    }
  }
});

test('blog rejects an incomplete managed index before copying either skill', (t) => {
  const project = temporaryProject(t);
  const original = '<!-- ai-dev-kit:codex-skills:start -->\n';
  fs.writeFileSync(path.join(project, 'AGENTS.md'), original);
  const rejected = run(['add', 'skill', 'blog'], project);
  assert.notEqual(rejected.status, 0);
  assert.deepEqual(fs.readdirSync(project), ['AGENTS.md']);
  assert.equal(fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8'), original);
});
