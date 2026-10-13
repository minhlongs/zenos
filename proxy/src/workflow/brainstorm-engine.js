'use strict';

const EventEmitter = require('node:events');
const crypto = require('node:crypto');
const { DebateProtocol } = require('./debate-protocol');
const { AriCalculator } = require('./ari-calculator');

/**
 * BrainstormEngine - Autonomous Architectural Brainstorming & Socratic Gating Engine
 * Strict Invariant: < 200 LOC, Zero external dependencies.
 */
class BrainstormEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.protocol = options.protocol || new DebateProtocol();
    this.ariCalc = options.ariCalculator || new AriCalculator();
    this.sessions = new Map();
  }

  async startSession(params = {}) {
    const { topic = 'Autonomous Refactor', targetFile = '', context = {} } = params;
    const id = `brainstorm_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    const session = {
      id,
      topic,
      targetFile,
      context,
      turns: [],
      strategies: [],
      recommendedStrategy: null,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    this.sessions.set(id, session);
    this.emit('session_start', { id, topic, targetFile });

    // Turn 1: Advocate
    const advocateTurn = this.protocol.generateAdvocateTurn(topic, context);
    session.turns.push(advocateTurn);
    this.emit('debate_turn', { sessionId: id, ...advocateTurn });

    // Cooperative tick yield for Metal GPU / Apple Silicon
    await new Promise((resolve) => setTimeout(resolve, 5));

    // Turn 2: Adversary
    const adversaryTurn = this.protocol.generateAdversaryTurn(topic, context);
    session.turns.push(adversaryTurn);
    this.emit('debate_turn', { sessionId: id, ...adversaryTurn });

    await new Promise((resolve) => setTimeout(resolve, 5));

    // Turn 3: Synthesizer
    const synthTurn = this.protocol.generateSynthesizerTurn(topic, session.turns, context);
    session.turns.push(synthTurn);
    this.emit('debate_turn', { sessionId: id, ...synthTurn });

    // Rank candidate strategies with ARI
    const rankedStrategies = this.ariCalc.rankStrategies(synthTurn.candidateStrategies);
    session.strategies = rankedStrategies;
    session.recommendedStrategy = rankedStrategies.find((s) => s.isRecommended) || rankedStrategies[0] || null;
    session.status = 'completed';

    this.emit('synthesis_complete', {
      sessionId: id,
      recommendedStrategy: session.recommendedStrategy,
      strategiesCount: session.strategies.length
    });

    return session;
  }

  getSession(id) {
    return this.sessions.get(id) || null;
  }

  listSessions() {
    return Array.from(this.sessions.values()).map((s) => ({
      id: s.id,
      topic: s.topic,
      targetFile: s.targetFile,
      status: s.status,
      strategyCount: s.strategies.length,
      recommended: s.recommendedStrategy ? s.recommendedStrategy.name : null,
      createdAt: s.createdAt
    }));
  }

  dispatchToZen(sessionId, strategyId) {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Brainstorm session not found: ${sessionId}`);

    const strategy = session.strategies.find((s) => s.id === strategyId) || session.recommendedStrategy;
    if (!strategy) throw new Error(`Strategy not found: ${strategyId}`);

    return {
      topic: session.topic,
      strategyId: strategy.id,
      strategyName: strategy.name,
      ariScore: strategy.ariScore,
      targetFile: session.targetFile,
      steps: [
        `Pre-flight: Run invariant audit and backup on ${session.targetFile || 'workspace'}`,
        `Isolation: Spin ephemeral worktree branch for ${strategy.name}`,
        `Decomposition: Implement ${strategy.description}`,
        `Dual-Key Verification: Run ProcessJail deterministic tests and ARI check (< 60)`
      ],
      createdAt: new Date().toISOString()
    };
  }
}

module.exports = { BrainstormEngine };
