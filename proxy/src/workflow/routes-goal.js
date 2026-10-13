'use strict';

const express = require('express');

function createGoalRouter(options = {}) {
  const router = express.Router();
  const goalManager = options.goalManager;
  const agentSupervisor = options.agentSupervisor;

  router.post('/', (req, res) => {
    const { goalId, title, spec } = req.body || {};
    const id = goalId || `goal_${Date.now()}`;
    try {
      const goal = goalManager.startGoal(id, { title, spec });
      agentSupervisor.registerActiveTask(id, { goalId: id });
      return res.status(201).json({ goal });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  router.get('/:id', (req, res) => {
    const goal = goalManager.getStatus(req.params.id);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    return res.status(200).json({ goal });
  });

  router.post('/:id/pause', (req, res) => {
    try {
      const goal = goalManager.pause(req.params.id, req.body?.reason);
      return res.status(200).json({ goal });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  router.post('/:id/resume', (req, res) => {
    try {
      const goal = goalManager.resume(req.params.id);
      return res.status(200).json({ goal });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  router.post('/:id/abort', (req, res) => {
    try {
      const goal = goalManager.abort(req.params.id, req.body?.reason);
      agentSupervisor.unregisterActiveTask(req.params.id, { reason: 'aborted' });
      return res.status(200).json({ goal });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createGoalRouter };
