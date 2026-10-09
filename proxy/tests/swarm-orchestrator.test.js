'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { SwarmOrchestrator } = require('../src/workflow/swarm-orchestrator.js');
const { SwarmBlackboard } = require('../src/workflow/swarm-blackboard.js');

test('SwarmOrchestrator completes on round 1 when dual-key passes', async () => {
  const orchestrator = new SwarmOrchestrator();
  const events = [];
  orchestrator.on('swarm_turn_start', e => events.push(e));
  orchestrator.on('swarm_consensus_eval', e => events.push(e));

  const result = await orchestrator.run({
    objective: 'Implement user session token verification',
    maxRounds: 3
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.rounds, 1);
  assert.strictEqual(result.consensus.approved, true);
  assert.strictEqual(result.session.status, 'CONSENSUS_REACHED');

  const arts = orchestrator.blackboard.getArtifacts(result.session.id);
  assert.strictEqual(arts.length, 4); // SPEC, CODE_DIFF, TEST_OUTPUT, AUDIT_REPORT
});

test('SwarmOrchestrator retries when verifier fails, reaches max rounds', async () => {
  const orchestrator = new SwarmOrchestrator();
  let callCount = 0;

  const failingTestRunner = async () => {
    callCount++;
    return { exitCode: 1, stdout: '', stderr: 'AssertionError: expected true' };
  };

  const result = await orchestrator.run({
    objective: 'Buggy task',
    maxRounds: 2,
    testRunner: failingTestRunner
  });

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.rounds, 2);
  assert.strictEqual(callCount, 2);
  assert.strictEqual(result.session.status, 'CONSENSUS_FAILED');
  assert.strictEqual(result.consensus.approved, false);
});

test('SwarmOrchestrator retries and recovers on round 2', async () => {
  const orchestrator = new SwarmOrchestrator();
  let attempt = 0;

  const recoveringTestRunner = async () => {
    attempt++;
    if (attempt === 1) return { exitCode: 1, stdout: '', stderr: 'Fail on round 1' };
    return { exitCode: 0, stdout: 'Pass on round 2', stderr: '' };
  };

  const result = await orchestrator.run({
    objective: 'Self-repairing swarm task',
    maxRounds: 3,
    testRunner: recoveringTestRunner
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.rounds, 2);
  assert.strictEqual(result.session.status, 'CONSENSUS_REACHED');
});
