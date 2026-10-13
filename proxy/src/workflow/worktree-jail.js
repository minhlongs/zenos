// proxy/src/workflow/worktree-jail.js - Zero-Dependency Git Worktree Isolation Harness
'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

class WorktreeJail {
  constructor(options = {}) {
    const rawRoot = options.workspaceRoot || process.cwd();
    this.workspaceRoot = fs.existsSync(rawRoot) ? fs.realpathSync(rawRoot) : rawRoot;
    this.worktreesDir = options.worktreesDir || path.join(this.workspaceRoot, '.zenos', 'worktrees');
    this.ensureWorktreesDir();
  }

  ensureWorktreesDir() {
    if (!fs.existsSync(this.worktreesDir)) {
      fs.mkdirSync(this.worktreesDir, { recursive: true });
    }
    const gitignorePath = path.join(this.worktreesDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      try {
        fs.writeFileSync(gitignorePath, '*\n!.gitignore\n', 'utf-8');
      } catch {
        // Directory may be managed by git
      }
    }
  }

  execGit(args, cwd = this.workspaceRoot) {
    try {
      return execFileSync('git', args, {
        cwd,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe']
      }).trim();
    } catch (err) {
      const msg = err.stderr ? err.stderr.toString().trim() : err.message;
      throw new Error(`Git error [${args.join(' ')}]: ${msg}`);
    }
  }

  createWorktree({ id, branch, baseCommit = 'HEAD' }) {
    if (!id) throw new Error('Worktree ID is required');
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const targetPath = path.join(this.worktreesDir, safeId);
    const branchName = branch || `zenos/wt-${safeId}`;

    if (fs.existsSync(targetPath)) {
      throw new Error(`Worktree directory already exists at ${targetPath}`);
    }

    try {
      this.execGit(['worktree', 'add', '-b', branchName, targetPath, baseCommit]);
    } catch (err) {
      if (err.message.includes('already exists')) {
        this.execGit(['worktree', 'add', targetPath, branchName]);
      } else {
        throw err;
      }
    }

    const headSha = this.execGit(['rev-parse', 'HEAD'], targetPath);

    return {
      id: safeId,
      path: targetPath,
      branch: branchName,
      headSha,
      createdAt: new Date().toISOString()
    };
  }

  listWorktrees() {
    const raw = this.execGit(['worktree', 'list', '--porcelain']);
    const worktrees = [];
    const entries = raw.split('\n\n');

    for (const entry of entries) {
      if (!entry.trim()) continue;
      const lines = entry.trim().split('\n');
      const wt = { path: '', headSha: '', branch: '', isMain: false };

      for (const line of lines) {
        if (line.startsWith('worktree ')) wt.path = line.substring(9).trim();
        else if (line.startsWith('HEAD ')) wt.headSha = line.substring(5).trim();
        else if (line.startsWith('branch ')) {
          wt.branch = line.substring(7).trim().replace('refs/heads/', '');
        }
      }

      if (path.resolve(wt.path) === path.resolve(this.workspaceRoot)) {
        wt.isMain = true;
      }

      if (wt.path) {
        const id = path.basename(wt.path);
        worktrees.push({
          id,
          ...wt,
          isManaged: wt.path.startsWith(this.worktreesDir)
        });
      }
    }

    return worktrees;
  }

  removeWorktree(id, options = {}) {
    if (!id) throw new Error('Worktree ID is required');
    const targetPath = path.join(this.worktreesDir, id);
    let branchName = null;

    const list = this.listWorktrees();
    const existing = list.find((w) => w.id === id || w.path === targetPath);
    if (existing) branchName = existing.branch;

    if (fs.existsSync(targetPath)) {
      this.execGit(['worktree', 'remove', '--force', targetPath]);
    }

    this.prune();

    if (options.deleteBranch && branchName && !branchName.startsWith('main')) {
      try {
        this.execGit(['branch', '-D', branchName]);
      } catch {
        // Ignore if branch already cleaned
      }
    }

    return { success: true, id, removedPath: targetPath, branchName };
  }

  prune() {
    this.execGit(['worktree', 'prune']);
    return { success: true };
  }

  cleanupAll() {
    const active = this.listWorktrees().filter((w) => w.isManaged);
    const results = [];
    for (const wt of active) {
      try {
        const res = this.removeWorktree(wt.id, { deleteBranch: true });
        results.push(res);
      } catch (err) {
        results.push({ id: wt.id, error: err.message });
      }
    }
    return results;
  }
}

module.exports = { WorktreeJail };
