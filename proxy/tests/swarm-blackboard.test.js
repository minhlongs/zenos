'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { DatabaseSync } = require('node:sqlite');
const { SwarmBlackboard } = require('../src/workflow/swarm-blackboard.js');

test('SwarmBlackboard initializes tables in in-memory DB', () => {
  const bb = new SwarmBlackboard();
  const sessions = bb.listSessions();
  assert.strictEqual(sessions.length, 0);
});

test('SwarmBlackboard creates and retrieves session', () => {
  const db = new DatabaseSync(':memory:');
  const bb = new SwarmBlackboard(db);

  const session = bb.createSession({
    id: 'sess-123',
    objective: 'Refactor auth controller',
    maxRounds: 5
  });

  assert.strictEqual(session.id, 'sess-123');
  assert.strictEqual(session.objective, 'Refactor auth controller');
  assert.strictEqual(session.status, 'PLANNING');
  assert.strictEqual(session.currentRole, 'PLANNER');
  assert.strictEqual(session.currentRound, 1);
  assert.strictEqual(session.maxRounds, 5);
  assert.strictEqual(session.artifacts.length, 0);
  assert.strictEqual(session.consensus, null);

  const fetched = bb.getSession('sess-123');
  assert.strictEqual(fetched.id, 'sess-123');
  assert.strictEqual(fetched.objective, 'Refactor auth controller');
});

test('SwarmBlackboard updates session status and role/round', () => {
  const bb = new SwarmBlackboard();
  bb.createSession({ id: 'sess-abc', objective: 'Test flow' });

  const updated1 = bb.updateSessionStatus('sess-abc', 'CODING', 'CODER', 2);
  assert.strictEqual(updated1.status, 'CODING');
  assert.strictEqual(updated1.currentRole, 'CODER');
  assert.strictEqual(updated1.currentRound, 2);

  const updated2 = bb.updateSessionStatus('sess-abc', {
    status: 'VERIFYING',
    currentRole: 'VERIFIER',
    currentRound: 2
  });
  assert.strictEqual(updated2.status, 'VERIFYING');
  assert.strictEqual(updated2.currentRole, 'VERIFIER');
});

test('SwarmBlackboard posts and retrieves artifacts by type and round', () => {
  const bb = new SwarmBlackboard();
  bb.createSession({ id: 'sess-art', objective: 'Artifact demo' });

  const a1 = bb.postArtifact({
    sessionId: 'sess-art',
    role: 'PLANNER',
    artifactType: 'SPEC',
    content: 'spec plan markdown',
    round: 1
  });
  assert.ok(a1.id);
  assert.strictEqual(a1.artifactType, 'SPEC');

  bb.postArtifact({
    sessionId: 'sess-art',
    role: 'CODER',
    artifactType: 'CODE_DIFF',
    content: { diff: '+ console.log(1)' },
    round: 1
  });

  bb.postArtifact({
    sessionId: 'sess-art',
    role: 'VERIFIER',
    artifactType: 'TEST_OUTPUT',
    content: 'PASS: 10 tests',
    round: 1
  });

  const allArts = bb.getArtifacts('sess-art');
  assert.strictEqual(allArts.length, 3);

  const specArts = bb.getArtifacts('sess-art', 'SPEC');
  assert.strictEqual(specArts.length, 1);
  assert.strictEqual(specArts[0].content, 'spec plan markdown');

  const sess = bb.getSession('sess-art');
  assert.strictEqual(sess.artifacts.length, 3);
});

test('SwarmBlackboard records and queries consensus state', () => {
  const bb = new SwarmBlackboard();
  bb.createSession({ id: 'sess-con', objective: 'Consensus check' });

  const c1 = bb.recordConsensus({
    sessionId: 'sess-con',
    verifierPass: true,
    auditorPass: false,
    verdict: 'REJECTED',
    notes: 'Auditor found high LOC'
  });

  assert.strictEqual(c1.sessionId, 'sess-con');
  assert.strictEqual(c1.verifierPass, true);
  assert.strictEqual(c1.auditorPass, false);
  assert.strictEqual(c1.verdict, 'REJECTED');

  const c2 = bb.recordConsensus({
    sessionId: 'sess-con',
    verifierPass: true,
    auditorPass: true,
    verdict: 'APPROVED',
    notes: 'Dual key satisfied'
  });

  assert.strictEqual(c2.verifierPass, true);
  assert.strictEqual(c2.auditorPass, true);
  assert.strictEqual(c2.verdict, 'APPROVED');

  const fetched = bb.getConsensus('sess-con');
  assert.strictEqual(fetched.verdict, 'APPROVED');
});

test('SwarmBlackboard listSessions returns ordered sessions', () => {
  const bb = new SwarmBlackboard();
  bb.createSession({ id: 's1', objective: 'obj 1' });
  bb.createSession({ id: 's2', objective: 'obj 2' });

  const list = bb.listSessions(10);
  assert.strictEqual(list.length, 2);
});
