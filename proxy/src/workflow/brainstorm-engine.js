'use strict';

const EventEmitter = require('node:events');
const crypto = require('node:crypto');
const { DebateProtocol } = require('./debate-protocol');
const { AriCalculator } = require('./ari-calculator');
const { DeepCodeInspector } = require('./deep-code-inspector');

/**
 * BrainstormEngine - Autonomous Architectural Brainstorming & Socratic Gating Engine
 * Supports Standard (3-Turn) and --deep (5-Turn AST/Lexical Cross-Examination + Hotspot Auto-Triage)
 * Strict Invariant: < 200 LOC, Zero external dependencies.
 */
class BrainstormEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.protocol = options.protocol || new DebateProtocol();
    this.ariCalc = options.ariCalculator || new AriCalculator();
    this.inspector = options.inspector || new DeepCodeInspector({ rootDir: options.rootDir });
    this.sessions = new Map();
  }

  async startSession(params = {}) {
    const {
      topic = 'Autonomous Refactor',
      targetFile = '',
      context = {},
      deep = false
    } = params;
    const id = `brainstorm_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    const inspected = targetFile ? this.inspector.inspectFile(targetFile) : null;
    const detectedSeamsCount = inspected
      ? (Array.isArray(inspected.detectedSeams) ? inspected.detectedSeams.length : Number(inspected.detectedSeams) || 2)
      : (Number(context.detectedSeams) || 2);

    const telemetry = inspected ? {
      totalLines: inspected.totalLines,
      codeLines: inspected.codeLines,
      branchingCount: inspected.branchingCount,
      fanIn: inspected.fanIn,
      fanOut: inspected.fanOut,
      detectedSeams: detectedSeamsCount,
      monolithScore: inspected.monolithScore,
      blastRadiusScore: inspected.blastRadiusScore,
      riskLevel: inspected.riskLevel
    } : null;

    const mergedContext = {
      ...telemetry,
      ...context,
      targetFile,
      detectedSeams: detectedSeamsCount,
      blastRadius: context.blastRadius ?? inspected?.blastRadiusScore ?? 28,
      complexity: context.complexity ?? inspected?.branchingCount ?? 18,
      splitBlueprint: context.splitBlueprint || inspected?.splitBlueprint || null
    };

    const session = {
      id,
      topic,
      targetFile,
      deep: Boolean(deep),
      telemetry,
      splitBlueprint: mergedContext.splitBlueprint,
      context: mergedContext,
      turns: [],
      strategies: [],
      recommendedStrategy: null,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    this.sessions.set(id, session);
    this.emit('session_start', { id, topic, targetFile, deep: session.deep, telemetry });

    const pushTurn = async (turn) => {
      session.turns.push(turn);
      this.emit('debate_turn', { sessionId: id, ...turn });
      await new Promise((resolve) => setTimeout(resolve, 4));
    };

    await pushTurn(this.protocol.generateAdvocateTurn(topic, mergedContext));
    await pushTurn(this.protocol.generateAdversaryTurn(topic, mergedContext));

    if (session.deep) {
      await pushTurn(this.protocol.generateCrossExaminerTurn(topic, mergedContext));
      await pushTurn(this.protocol.generateRebuttalTurn(topic, mergedContext));
    }

    const synthTurn = this.protocol.generateSynthesizerTurn(topic, session.turns, mergedContext);
    session.turns.push(synthTurn);
    this.emit('debate_turn', { sessionId: id, ...synthTurn });

    const rankedStrategies = this.ariCalc.rankStrategies(synthTurn.candidateStrategies);
    session.strategies = rankedStrategies;
    session.recommendedStrategy = rankedStrategies.find((s) => s.isRecommended) || rankedStrategies[0] || null;
    session.status = 'completed';

    this.emit('synthesis_complete', {
      sessionId: id,
      deep: session.deep,
      recommendedStrategy: session.recommendedStrategy,
      strategiesCount: session.strategies.length
    });

    return session;
  }

  async autoBrainstormHotspots(limit = 3, scanDir = null) {
    const hotspots = this.inspector.discoverHotspots(limit, scanDir);
    const createdSessions = [];
    for (const h of hotspots) {
      const s = await this.startSession({
        topic: `Deep Modularization: ${h.targetFile} (${h.totalLines} LOC)`,
        targetFile: h.targetFile,
        deep: true
      });
      createdSessions.push(s);
    }
    this.emit('hotspots_brainstormed', { count: createdSessions.length });
    return createdSessions;
  }

  getSession(id) {
    return this.sessions.get(id) || null;
  }

  listSessions() {
    return Array.from(this.sessions.values()).map((s) => ({
      id: s.id,
      topic: s.topic,
      targetFile: s.targetFile,
      deep: s.deep,
      telemetry: s.telemetry,
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

    const subSteps = (session.splitBlueprint?.extractedSubmodules || []).map(
      (sub) => `Slice submodule: ${sub.path} (~${sub.estimatedLoc} LOC) — ${sub.responsibility}`
    );

    return {
      topic: session.topic,
      strategyId: strategy.id,
      strategyName: strategy.name,
      ariScore: strategy.ariScore,
      targetFile: session.targetFile,
      splitBlueprint: session.splitBlueprint || null,
      steps: [
        `Pre-flight: Run invariant audit and backup on ${session.targetFile || 'workspace'}`,
        `Isolation: Spin ephemeral worktree branch for ${strategy.name}`,
        ...subSteps,
        `Decomposition: Implement ${strategy.description}`,
        `Dual-Key Verification: Run ProcessJail deterministic tests and ARI check (< 60)`
      ],
      createdAt: new Date().toISOString()
    };
  }
}

module.exports = { BrainstormEngine };
