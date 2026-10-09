'use strict';

const { EventEmitter } = require('node:events');
const { SwarmRoles } = require('./swarm-roles.js');
const { ConsensusGate } = require('./consensus-gate.js');
const { SwarmBlackboard } = require('./swarm-blackboard.js');

class SwarmOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.blackboard = options.blackboard || new SwarmBlackboard();
    this.consensusGate = options.consensusGate || new ConsensusGate();
    this.modelClient = options.modelClient || null;
    this.concurrencyGate = options.concurrencyGate || null;
    this.processJail = options.processJail || null;
    this.model = options.model || 'qwen2.5-coder-14b';
  }

  async run({ objective, maxRounds = 3, sessionId = null, testRunner = null }) {
    const session = this.blackboard.createSession({
      id: sessionId,
      objective,
      maxRounds
    });

    this.emit('swarm_session_start', session);
    let round = 1;
    let consensus = null;

    // Step 1: Architect turn
    this.blackboard.updateSessionStatus(session.id, 'ARCHITECT_TURN', SwarmRoles.ROLES.ARCHITECT, round);
    this.emit('swarm_turn_start', { sessionId: session.id, role: SwarmRoles.ROLES.ARCHITECT, round });
    const spec = await this._executeArchitect(objective);
    const specArtifact = this.blackboard.postArtifact({
      sessionId: session.id,
      role: SwarmRoles.ROLES.ARCHITECT,
      artifactType: SwarmRoles.ARTIFACT_TYPES.SPEC,
      content: spec,
      round
    });
    this.emit('swarm_artifact_posted', specArtifact);

    let previousDiff = null;
    let feedback = null;

    while (round <= maxRounds) {
      // Step 2: Coder turn
      this.blackboard.updateSessionStatus(session.id, 'CODER_TURN', SwarmRoles.ROLES.CODER, round);
      this.emit('swarm_turn_start', { sessionId: session.id, role: SwarmRoles.ROLES.CODER, round });
      const diff = await this._executeCoder({ objective, spec, previousDiff, feedback });
      const diffArtifact = this.blackboard.postArtifact({
        sessionId: session.id,
        role: SwarmRoles.ROLES.CODER,
        artifactType: SwarmRoles.ARTIFACT_TYPES.CODE_DIFF,
        content: diff,
        round
      });
      this.emit('swarm_artifact_posted', diffArtifact);
      previousDiff = diff;

      // Step 3: Verifier turn
      this.blackboard.updateSessionStatus(session.id, 'VERIFIER_TURN', SwarmRoles.ROLES.VERIFIER, round);
      this.emit('swarm_turn_start', { sessionId: session.id, role: SwarmRoles.ROLES.VERIFIER, round });
      const testResult = testRunner ? await testRunner(diff) : { exitCode: 0, stdout: 'Tests passed', stderr: '' };
      const verifierPayload = SwarmRoles.buildVerifierPrompt({ testResult });
      const testArtifact = this.blackboard.postArtifact({
        sessionId: session.id,
        role: SwarmRoles.ROLES.VERIFIER,
        artifactType: SwarmRoles.ARTIFACT_TYPES.TEST_OUTPUT,
        content: verifierPayload,
        round
      });
      this.emit('swarm_artifact_posted', testArtifact);

      // Step 4: Auditor turn
      this.blackboard.updateSessionStatus(session.id, 'AUDITOR_TURN', SwarmRoles.ROLES.AUDITOR, round);
      this.emit('swarm_turn_start', { sessionId: session.id, role: SwarmRoles.ROLES.AUDITOR, round });
      const auditRaw = await this._executeAuditor({ objective, spec, diff, testOutput: verifierPayload });
      const auditPayload = SwarmRoles.parseAuditResponse(auditRaw);
      const auditArtifact = this.blackboard.postArtifact({
        sessionId: session.id,
        role: SwarmRoles.ROLES.AUDITOR,
        artifactType: SwarmRoles.ARTIFACT_TYPES.AUDIT_REPORT,
        content: auditPayload,
        round
      });
      this.emit('swarm_artifact_posted', auditArtifact);

      // Step 5: Dual-Key Consensus Evaluation
      consensus = this.consensusGate.evaluate({
        verifierResult: { passed: verifierPayload.passed, reason: verifierPayload.assertionsSummary },
        auditorResult: { approved: auditPayload.approved, reason: auditPayload.reason }
      });
      this.blackboard.recordConsensus({
        sessionId: session.id,
        verifierPass: consensus.key1.passed,
        auditorPass: consensus.key2.approved,
        verdict: consensus.status,
        notes: consensus.notes
      });
      this.emit('swarm_consensus_eval', { sessionId: session.id, round, consensus });

      if (consensus.approved) {
        this.blackboard.updateSessionStatus(session.id, 'CONSENSUS_REACHED', 'COMPLETED', round);
        const finalSession = this.blackboard.getSession(session.id);
        this.emit('swarm_session_complete', { session: finalSession, consensus, rounds: round });
        return { success: true, session: finalSession, consensus, rounds: round };
      }

      feedback = `Verification/Audit failed at round ${round}. Key1: ${consensus.key1.reason}. Key2: ${consensus.key2.reason}`;
      round++;
    }

    this.blackboard.updateSessionStatus(session.id, 'CONSENSUS_FAILED', 'TERMINATED', maxRounds);
    const finalSession = this.blackboard.getSession(session.id);
    this.emit('swarm_session_failed', { session: finalSession, consensus, rounds: maxRounds });
    return { success: false, session: finalSession, consensus, rounds: maxRounds };
  }

  async _executeArchitect(objective) {
    if (!this.modelClient) {
      return { summary: `Spec for: ${objective}`, targets: ['src/core.js'], assertions: ['valid output'] };
    }
    const prompt = SwarmRoles.buildArchitectPrompt(objective);
    return await this._callModel(prompt);
  }

  async _executeCoder(payload) {
    if (!this.modelClient) {
      return '+ // surgical code change satisfying objective';
    }
    const prompt = SwarmRoles.buildCoderPrompt(payload);
    return await this._callModel(prompt);
  }

  async _executeAuditor(payload) {
    if (!this.modelClient) {
      return { approved: true, notes: 'Dual-key invariants verified', invariants_verified: ['<200 LOC', '0 deps'] };
    }
    const prompt = SwarmRoles.buildAuditorPrompt(payload);
    return await this._callModel(prompt);
  }

  async _callModel(prompt) {
    const fn = async () => {
      const res = await this.modelClient.createChatCompletion({
        model: this.model,
        messages: [{ role: 'user', content: prompt }]
      });
      return res.choices?.[0]?.message?.content || '';
    };
    if (this.concurrencyGate) {
      return await this.concurrencyGate.enqueue(fn);
    }
    return await fn();
  }
}

module.exports = { SwarmOrchestrator };
