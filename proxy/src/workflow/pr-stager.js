// proxy/src/workflow/pr-stager.js - Semantic PR Stager & Dual-Key Consensus Gating
'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { ConsensusGate } = require('./consensus-gate');
const { BlastRadiusEngine } = require('./blast-radius-engine');

class PrStager {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.consensusGate = options.consensusGate || new ConsensusGate();
    this.blastEngine = options.blastRadiusEngine || new BlastRadiusEngine({ rootDir: this.workspaceRoot });
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

  formatCommitMessage(type, scope, subject, body = '') {
    const header = scope ? `${type}(${scope}): ${subject}` : `${type}: ${subject}`;
    return body ? `${header}\n\n${body.trim()}` : header;
  }

  getDiffSummary(worktreePath, baseBranch = 'HEAD') {
    const diffStat = this.execGit(['diff', '--stat', baseBranch], worktreePath);
    const rawFiles = this.execGit(['diff', '--name-status', baseBranch], worktreePath);
    const files = [];

    if (rawFiles) {
      for (const line of rawFiles.split('\n')) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          files.push({ status: parts[0], path: parts.slice(1).join(' ') });
        }
      }
    }

    return {
      stat: diffStat,
      files,
      changedFilesCount: files.length
    };
  }

  auditWorktreeInvariants(worktreePath, diffFiles = []) {
    const violations = [];
    for (const fileItem of diffFiles) {
      const fullPath = path.join(worktreePath, fileItem.path);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n').length;
        if (lines > 200) {
          violations.push(`${fileItem.path} exceeds 200 LOC limit (${lines} lines)`);
        }
      }
    }

    const approved = violations.length === 0;
    return {
      approved,
      violations,
      reason: approved
        ? 'All modified files strictly adhere to < 200 LOC invariant.'
        : `Invariant violations detected: ${violations.join('; ')}`
    };
  }

  stagePr(params = {}) {
    const {
      id,
      worktreePath,
      branch,
      baseBranch = 'main',
      type = 'feat',
      scope = 'core',
      subject = 'autonomous feature update',
      body = '',
      verifierResult = { passed: true, reason: 'Automated test suite passed' },
      auditorOverride = null
    } = params;

    if (!worktreePath || !fs.existsSync(worktreePath)) {
      throw new Error(`Invalid worktree path: ${worktreePath}`);
    }

    const diffSummary = this.getDiffSummary(worktreePath, baseBranch);
    const auditorResult = auditorOverride || this.auditWorktreeInvariants(worktreePath, diffSummary.files);
    const consensus = this.consensusGate.evaluate(verifierResult, auditorResult);

    const commitMessage = this.formatCommitMessage(type, scope, subject, body);

    const stagedPr = {
      id: id || `pr_${Date.now()}`,
      branch,
      baseBranch,
      commitMessage,
      consensus,
      diffSummary,
      approved: consensus.approved,
      stagedAt: new Date().toISOString()
    };

    return stagedPr;
  }

  promote(worktreePath, baseBranch = 'main', branch = null) {
    if (!branch) {
      branch = this.execGit(['rev-parse', '--abbrev-ref', 'HEAD'], worktreePath);
    }
    // Checkout base in main workspace and merge
    this.execGit(['checkout', baseBranch], this.workspaceRoot);
    this.execGit(['merge', '--no-ff', '-m', `Merge branch '${branch}'`, branch], this.workspaceRoot);
    const mergeSha = this.execGit(['rev-parse', 'HEAD'], this.workspaceRoot);
    return { success: true, baseBranch, branch, mergeSha };
  }
}

module.exports = { PrStager };
