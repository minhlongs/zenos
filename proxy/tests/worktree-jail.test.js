// proxy/tests/worktree-jail.test.js - Unit Tests for WorktreeJail
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { WorktreeJail } = require('../src/workflow/worktree-jail');

test('WorktreeJail creates, lists, and safely removes ephemeral worktrees', async (t) => {
  const tmpRepo = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'zenos-wt-test-')));
  execFileSync('git', ['init', '-b', 'main'], { cwd: tmpRepo });
  execFileSync('git', ['config', 'user.name', 'ZenOS Tester'], { cwd: tmpRepo });
  execFileSync('git', ['config', 'user.email', 'test@zenos.local'], { cwd: tmpRepo });
  fs.writeFileSync(path.join(tmpRepo, 'README.md'), '# Test\n', 'utf-8');
  execFileSync('git', ['add', '.'], { cwd: tmpRepo });
  execFileSync('git', ['commit', '-m', 'Initial commit'], { cwd: tmpRepo });

  const jail = new WorktreeJail({ workspaceRoot: tmpRepo });

  t.test('listWorktrees discovers main worktree', () => {
    const list = jail.listWorktrees();
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].isMain, true);
    assert.strictEqual(list[0].branch, 'main');
  });

  t.test('createWorktree creates isolated ephemeral worktree', () => {
    const wt = jail.createWorktree({ id: 'agent-1' });
    assert.strictEqual(wt.id, 'agent-1');
    assert.strictEqual(wt.branch, 'zenos/wt-agent-1');
    assert.ok(fs.existsSync(wt.path));

    const list = jail.listWorktrees();
    assert.strictEqual(list.length, 2);
    const created = list.find((w) => w.id === 'agent-1');
    assert.ok(created);
    assert.strictEqual(created.isManaged, true);
  });

  t.test('removeWorktree deletes worktree and branch', () => {
    const res = jail.removeWorktree('agent-1', { deleteBranch: true });
    assert.strictEqual(res.success, true);

    const list = jail.listWorktrees();
    assert.strictEqual(list.length, 1);
  });

  t.after(() => {
    try {
      fs.rmSync(tmpRepo, { recursive: true, force: true });
    } catch {}
  });
});
