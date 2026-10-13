'use strict';

const express = require('express');
const { BrainstormEngine } = require('./brainstorm-engine');

/**
 * routes-brainstorm.js - HTTP router for Socratic Brainstorming & Strategy Synthesis
 * Strict Invariant: < 200 LOC, Zero external dependencies.
 */
function createBrainstormRouter(options = {}) {
  const router = express.Router();
  const engine = options.brainstormEngine || new BrainstormEngine();
  const broadcast = options.broadcast || (() => {});

  // Forward internal events to SSE
  engine.on('session_start', (e) => broadcast('brainstorm_start', e));
  engine.on('debate_turn', (e) => broadcast('brainstorm_turn', e));
  engine.on('synthesis_complete', (e) => broadcast('brainstorm_synthesis', e));

  router.post('/start', async (req, res) => {
    try {
      const { topic, targetFile, context } = req.body || {};
      if (!topic) {
        return res.status(400).json({ error: 'topic is required' });
      }
      const session = await engine.startSession({ topic, targetFile, context });
      return res.status(201).json({ session });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  router.get('/sessions', (req, res) => {
    try {
      const sessions = engine.listSessions();
      return res.status(200).json({ sessions });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  router.get('/session/:id', (req, res) => {
    try {
      const session = engine.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      return res.status(200).json({ session });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  router.post('/dispatch-zen', (req, res) => {
    try {
      const { sessionId, strategyId } = req.body || {};
      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
      }
      const zenPlan = engine.dispatchToZen(sessionId, strategyId);
      broadcast('brainstorm_dispatched', { sessionId, zenPlan });
      return res.status(200).json({ zenPlan });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createBrainstormRouter };
