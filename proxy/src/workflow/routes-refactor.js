// proxy/src/workflow/routes-refactor.js - REST & SSE Router for Autonomous Refactoring
'use strict';

const express = require('express');
const { analyzeDirectory, analyzeFile } = require('./complexity-engine.js');
const { generateSlicePlan, applyPlan } = require('./refactor-controller.js');

function createRefactorRouter(options = {}) {
  const router = express.Router();
  const broadcast = options.broadcast || (() => {});

  router.post('/analyze', (req, res) => {
    try {
      const { path: targetPath = process.cwd() } = req.body || {};
      const result = analyzeDirectory(targetPath);
      broadcast('refactor_scan', { summary: result.summary, timestamp: new Date().toISOString() });
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  router.post('/plan', (req, res) => {
    try {
      const { filePath } = req.body || {};
      if (!filePath) return res.status(400).json({ error: 'filePath is required' });
      const plan = generateSlicePlan(filePath);
      broadcast('refactor_plan', { filePath, newFilesCount: plan.newFiles.length });
      return res.status(200).json({ targetFile: filePath, plan });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  router.post('/apply', async (req, res) => {
    try {
      const { plan, testCommand } = req.body || {};
      if (!plan || !plan.targetFile) return res.status(400).json({ error: 'Valid plan is required' });

      broadcast('refactor_start', { targetFile: plan.targetFile });
      const result = await applyPlan(plan, { testCommand });

      if (result.success) {
        broadcast('refactor_complete', { targetFile: plan.targetFile, consensus: result.consensus });
        return res.status(200).json(result);
      } else {
        broadcast('refactor_rollback', { targetFile: plan.targetFile, error: result.error });
        return res.status(422).json(result);
      }
    } catch (err) {
      broadcast('refactor_rollback', { error: err.message });
      return res.status(500).json({ error: err.message });
    }
  });

  router.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write(': connected\n\n');
  });

  return router;
}

module.exports = { createRefactorRouter };
