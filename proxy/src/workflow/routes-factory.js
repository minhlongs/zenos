'use strict';

const express = require('express');
const { ZenDirector } = require('./zen-director');
const { CookRunner } = require('./cook-runner');
const { GoalManager } = require('./goal-manager');

function createFactoryRouter(options = {}) {
  const router = express.Router();
  const zenDirector = options.zenDirector || new ZenDirector();
  const cookRunner = options.cookRunner || new CookRunner();
  const goalManager = options.goalManager || new GoalManager({ taskStore: options.taskStore });
  const sseClients = new Set();

  goalManager.on('transition', (event) => {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of sseClients) {
      client.write(data);
    }
  });

  router.post('/zen', (req, res) => {
    const { prompt, fileHint, context = {} } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }
    const plan = zenDirector.planExecution(prompt, { fileHint, ...context });
    return res.status(200).json({ plan });
  });

  router.post('/cook', (req, res) => {
    const { testCommand, targetFiles = [], maxIterations } = req.body || {};
    const runner = maxIterations ? new CookRunner({ maxIterations }) : cookRunner;
    const result = runner.runCycle({ testCommand, targetFiles });
    const statusCode = result.success ? 200 : 422;
    return res.status(statusCode).json(result);
  });

  router.post('/goal', (req, res) => {
    const { goalId, title, spec } = req.body || {};
    const id = goalId || `goal_${Date.now()}`;
    try {
      const goal = goalManager.startGoal(id, { title, spec });
      return res.status(201).json({ goal });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  router.get('/goal/:id', (req, res) => {
    const goal = goalManager.getStatus(req.params.id);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    return res.status(200).json({ goal });
  });

  router.post('/goal/:id/pause', (req, res) => {
    try {
      const goal = goalManager.pause(req.params.id, req.body?.reason);
      return res.status(200).json({ goal });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  router.post('/goal/:id/resume', (req, res) => {
    try {
      const goal = goalManager.resume(req.params.id);
      return res.status(200).json({ goal });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  router.post('/goal/:id/abort', (req, res) => {
    try {
      const goal = goalManager.abort(req.params.id, req.body?.reason);
      return res.status(200).json({ goal });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  router.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);
    res.write(': connected\n\n');

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  return router;
}

module.exports = { createFactoryRouter };
