'use strict';

const express = require('express');
const { BrainstormEngine } = require('./brainstorm-engine');

/**
 * routes-brainstorm.js - HTTP router for Socratic Brainstorming & Deep Code Introspection
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
  engine.on('hotspots_brainstormed', (e) => broadcast('brainstorm_hotspots', e));

  router.post('/start', async (req, res) => {
    try {
      const { topic, targetFile, context, deep, mode } = req.body || {};
      if (!topic) {
        return res.status(400).json({ error: 'topic is required' });
      }
      const isDeep = Boolean(deep || mode === '--deep' || mode === 'deep');
      const session = await engine.startSession({ topic, targetFile, context, deep: isDeep });
      return res.status(201).json({ session });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  router.get('/inspect', (req, res) => {
    try {
      const file = req.query.file;
      if (file) {
        const inspection = engine.inspector.inspectFile(String(file));
        return res.status(200).json({ inspection });
      }
      const limit = Math.min(10, Math.max(1, Number(req.query.limit) || 5));
      const hotspots = engine.inspector.discoverHotspots(limit);
      return res.status(200).json({ hotspots });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  router.post('/auto-hotspots', async (req, res) => {
    try {
      const limit = Math.min(5, Math.max(1, Number(req.body?.limit) || 3));
      const scanDir = req.body?.scanDir || null;
      const sessions = await engine.autoBrainstormHotspots(limit, scanDir);
      return res.status(201).json({ sessions, count: sessions.length });
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
