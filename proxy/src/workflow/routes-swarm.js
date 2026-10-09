'use strict';

const express = require('express');
const { SwarmOrchestrator } = require('./swarm-orchestrator.js');
const { SwarmBlackboard } = require('./swarm-blackboard.js');
const { ConsensusGate } = require('./consensus-gate.js');

function createSwarmRouter(options = {}) {
  const router = express.Router();
  const blackboard = options.blackboard || (options.db ? new SwarmBlackboard(options.db) : new SwarmBlackboard());
  const consensusGate = options.consensusGate || new ConsensusGate();
  const broadcast = options.broadcast || (() => {});

  const orchestrator = options.orchestrator || new SwarmOrchestrator({
    blackboard,
    consensusGate,
    modelClient: options.modelClient,
    concurrencyGate: options.concurrencyGate,
    processJail: options.processJail
  });

  orchestrator.on('swarm_session_start', (e) => broadcast('swarm_session_start', e));
  orchestrator.on('swarm_turn_start', (e) => broadcast('swarm_turn_start', e));
  orchestrator.on('swarm_artifact_posted', (e) => broadcast('swarm_artifact_posted', e));
  orchestrator.on('swarm_consensus_eval', (e) => broadcast('swarm_consensus_eval', e));
  orchestrator.on('swarm_session_complete', (e) => broadcast('swarm_session_complete', e));
  orchestrator.on('swarm_session_failed', (e) => broadcast('swarm_session_failed', e));

  router.get('/sessions', (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 20;
    const sessions = blackboard.listSessions(limit);
    return res.status(200).json({ sessions });
  });

  router.get('/sessions/:id', (req, res) => {
    const session = blackboard.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Swarm session not found' });
    }
    return res.status(200).json({ session });
  });

  router.get('/sessions/:id/artifacts', (req, res) => {
    const type = req.query.type;
    const artifacts = blackboard.getArtifacts(req.params.id, type);
    return res.status(200).json({ artifacts });
  });

  router.post('/run', async (req, res) => {
    const { objective, maxRounds = 3, wait = false, sessionId } = req.body || {};
    if (!objective) {
      return res.status(400).json({ error: 'objective is required' });
    }

    if (wait || req.query.wait === 'true') {
      try {
        const result = await orchestrator.run({ objective, maxRounds, sessionId });
        return res.status(200).json(result);
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }

    const assignedId = sessionId || `swarm_${Date.now()}`;
    orchestrator.run({ objective, maxRounds, sessionId: assignedId }).catch((err) => {
      broadcast('swarm_session_failed', { sessionId: assignedId, error: err.message });
    });

    return res.status(202).json({ sessionId: assignedId, status: 'running' });
  });

  return router;
}

module.exports = { createSwarmRouter };
