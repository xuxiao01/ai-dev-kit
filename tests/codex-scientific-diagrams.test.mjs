import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(packageRoot, 'bin', 'ai-dev-kit.js');
const skill = 'draw';

test('the scientific diagram skill is listed and can be installed with its resources', (t) => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-dev-kit-scientific-'));
  t.after(() => fs.rmSync(project, { recursive: true, force: true }));
  const agents = path.join(project, 'AGENTS.md');
  fs.writeFileSync(agents, '# Team instructions\n\nKeep this line.\n');

  const listed = spawnSync(process.execPath, [cli, 'codex', 'list'], { cwd: project, encoding: 'utf8' });
  assert.equal(listed.status, 0, listed.stderr);
  assert.match(listed.stdout.split('Optional skill pack:')[0], /^- draw$/m);

  const install = spawnSync(process.execPath, [cli, 'codex', 'add', 'skill', skill], {
    cwd: project, encoding: 'utf8'
  });
  assert.equal(install.status, 0, install.stderr);

  const resources = [
    'SKILL.md',
    'agents/openai.yaml',
    'scripts/export_drawio.py',
    'references/diagram-styles.md',
    'references/article-diagrams.md',
    'references/ppt-and-exports.md',
    ...['network-layers', 'operator-flow', 'architecture', 'concurrent-save']
      .flatMap((name) => [`assets/${name}.drawio`, `assets/${name}.png`])
  ];
  const installed = path.join(project, '.agents', 'skills');
  assert.deepEqual(fs.readdirSync(installed), [skill]);
  for (const file of resources) {
    assert.deepEqual(fs.readFileSync(path.join(installed, skill, file)),
      fs.readFileSync(path.join(packageRoot, 'codex', 'skills', skill, file)), file);
  }
  const lines = fs.readFileSync(agents, 'utf8');
  assert.match(lines, /Keep this line\./);
  assert.ok(lines.includes(`科研与技术绘图：.agents/skills/${skill}/SKILL.md`));

  const installAll = spawnSync(process.execPath, [cli, 'codex', 'add', 'skill', '--all'], {
    cwd: project, encoding: 'utf8'
  });
  assert.equal(installAll.status, 0, installAll.stderr);
  assert.equal(fs.readdirSync(installed).length, 8);
  assert.ok(fs.existsSync(path.join(installed, skill, 'assets', 'concurrent-save.drawio')));
});
