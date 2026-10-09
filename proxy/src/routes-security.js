'use strict';

const express = require('express');
const { classifyCommand } = require('./command-guard');
const { validatePath } = require('./path-guard');
const { ApprovalGate } = require('./approval-gate');

function createSecurityRouter(options = {}) {
  const router = express.Router();
  const approvalGate = options.approvalGate || new ApprovalGate();
  const allowedRoots = options.allowedRoots || [process.cwd()];

  // POST /security/evaluate
  router.post('/security/evaluate', (req, res) => {
    const { command, path } = req.body || {};
    const evaluation = {};

    if (command) {
      evaluation.command = command;
      const cmdResult = classifyCommand(command);
      Object.assign(evaluation, cmdResult);
    }

    if (path) {
      try {
        const resolved = validatePath(path, allowedRoots);
        evaluation.path = { path, resolved, allowed: true };
      } catch (err) {
        evaluation.path = { path, allowed: false, error: err.message };
      }
    }

    return res.status(200).json(evaluation);
  });

  // POST /approvals/request
  router.post('/approvals/request', (req, res) => {
    const { action, command, context, ttlSeconds } = req.body || {};
    if (!action) {
      return res.status(400).json({ error: 'Missing required field: action' });
    }
    const request = approvalGate.createRequest({ action, command, context, ttlSeconds });
    return res.status(201).json(request);
  });

  // GET /approvals
  router.get('/approvals', (req, res) => {
    const approvals = approvalGate.listActive();
    return res.status(200).json({ approvals });
  });

  // GET /approvals/:id
  router.get('/approvals/:id', (req, res) => {
    const status = approvalGate.getStatus(req.params.id);
    if (!status) {
      return res.status(404).json({ error: `Approval not found: ${req.params.id}` });
    }
    return res.status(200).json(status);
  });

  // POST /approvals/:id/resolve
  router.post('/approvals/:id/resolve', (req, res) => {
    const { token, approved, decidedBy } = req.body || {};
    if (!token) {
      return res.status(400).json({ error: 'Missing required field: token' });
    }
    try {
      const resolved = approvalGate.resolve(req.params.id, { token, approved, decidedBy });
      return res.status(200).json(resolved);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createSecurityRouter };
