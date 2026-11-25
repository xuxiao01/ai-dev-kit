import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(packageRoot, 'bin', 'ai-dev-kit.js');
const skill = 'git-submit';

test('the personal branch skill installs its resources without executing Git operations', (t) => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-dev-kit-personal-'));
  t.after(() => fs.rmSync(project, { recursive: true, force: true }));

  function git(...args) {
    const result = spawnSync('git', args, { cwd: project, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
  }

  git('init', '--initial-branch=main');
  fs.writeFileSync(path.join(project, 'work.txt'), 'pending work\n');
  git('add', 'work.txt');
  const stagedBefore = git('diff', '--cached');
  fs.writeFileSync(path.join(project, 'AGENTS.md'), '# Project conventions\n\nPreserve this text.\n');

  const listed = spawnSync(process.execPath, [cli, 'codex', 'list'], {
    cwd: project, encoding: 'utf8'
  });
  assert.equal(listed.status, 0, listed.stderr);
  assert.match(listed.stdout.split('Optional skill pack:')[0], /^- git-submit$/m);

  const installed = spawnSync(process.execPath, [cli, 'codex', 'add', 'skill', skill], {
    cwd: project, encoding: 'utf8'
  });
  assert.equal(installed.status, 0, installed.stderr);
  const destination = path.join(project, '.agents', 'skills', skill);
  for (const relative of ['SKILL.md', 'agents/openai.yaml']) {
    assert.deepEqual(fs.readFileSync(path.join(destination, relative)),
      fs.readFileSync(path.join(packageRoot, 'codex', 'skills', skill, relative)));
  }
  assert.deepEqual(fs.readdirSync(path.dirname(destination)), [skill]);
  const agents = fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8');
  assert.match(agents, /Preserve this text\./);
  assert.ok(agents.includes(`个人分支提交与同步：.agents/skills/${skill}/SKILL.md`));
  assert.equal(git('branch', '--show-current').trim(), 'main');
  assert.equal(git('diff', '--cached'), stagedBefore);
  assert.equal(spawnSync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: project }).status, 128);
  assert.equal(git('remote'), '');
});
