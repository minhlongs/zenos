// proxy/src/workflow/routes-worktree.js - Express Router for Worktree & PR Stager
'use strict';

const express = require('express');
const { WorktreeJail } = require('./worktree-jail');
const { BlastRadiusEngine } = require('./blast-radius-engine');
const { PrStager } = require('./pr-stager');

function createWorktreeRouter(options = {}) {
  const router = express.Router();
  const workspaceRoot = options.workspaceRoot || process.cwd();
  const worktreeJail = options.worktreeJail || new WorktreeJail({ workspaceRoot });
  const blastEngine = options.blastRadiusEngine || new BlastRadiusEngine({ rootDir: workspaceRoot });
  const prStager = options.prStager || new PrStager({ workspaceRoot, blastRadiusEngine: blastEngine });
  const broadcast = options.broadcast || (() => {});

  router.get('/list', (req, res) => {
    try {
      const worktrees = worktreeJail.listWorktrees();
      return res.status(200).json({ worktrees });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  router.post('/create', (req, res) => {
    const { id, branch, baseCommit = 'HEAD' } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    try {
      const worktree = worktreeJail.createWorktree({ id, branch, baseCommit });
      broadcast('worktree_created', worktree);
      return res.status(201).json({ worktree });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const deleteBranch = req.query.deleteBranch !== 'false';
    try {
      const result = worktreeJail.removeWorktree(id, { deleteBranch });
      broadcast('worktree_removed', result);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  router.post('/blast-radius', (req, res) => {
    const { targetPath, scope = 'file' } = req.body || {};
    try {
      if (scope === 'workspace') {
        const analysis = blastEngine.analyzeWorkspace();
        return res.status(200).json(analysis);
      }
      if (!targetPath) return res.status(400).json({ error: 'targetPath is required' });
      const radius = blastEngine.calculateBlastRadius(targetPath);
      return res.status(200).json(radius);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  router.post('/stage-pr', (req, res) => {
    const { id, worktreePath, branch, baseBranch, type, scope, subject, body, verifierResult } = req.body || {};
    if (!worktreePath) return res.status(400).json({ error: 'worktreePath is required' });
    try {
      const stagedPr = prStager.stagePr({
        id,
        worktreePath,
        branch,
        baseBranch,
        type,
        scope,
        subject,
        body,
        verifierResult
      });
      broadcast('pr_staged', stagedPr);
      return res.status(200).json(stagedPr);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  router.post('/promote', (req, res) => {
    const { worktreePath, baseBranch = 'main', branch } = req.body || {};
    if (!worktreePath) return res.status(400).json({ error: 'worktreePath is required' });
    try {
      const result = prStager.promote(worktreePath, baseBranch, branch);
      broadcast('branch_promoted', result);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createWorktreeRouter };
