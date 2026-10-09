'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { ConsensusGate } = require('../src/workflow/consensus-gate.js');

test('ConsensusGate approves when both verifier and auditor pass', () => {
  const gate = new ConsensusGate();
  const res = gate.evaluate({
    verifierResult: { passed: true, reason: 'All 15 tests pass' },
    auditorResult: { approved: true, reason: 'Zero security issues, all files <200 LOC' }
  });

  assert.strictEqual(res.approved, true);
  assert.strictEqual(res.status, 'APPROVED');
  assert.strictEqual(res.key1.passed, true);
  assert.strictEqual(res.key2.approved, true);
  assert.ok(res.notes.includes('Dual-key consensus reached'));

  const formatted = gate.formatVerdict(res);
  assert.ok(formatted.includes('[APPROVED]'));
  assert.ok(formatted.includes('Key1(Verifier)=PASS'));
  assert.ok(formatted.includes('Key2(Auditor)=PASS'));
});

test('ConsensusGate rejects when verifier fails', () => {
  const gate = new ConsensusGate();
  const res = gate.evaluate({
    verifierResult: { passed: false, reason: '2 tests failed' },
    auditorResult: { approved: true, reason: 'Policy compliant' }
  });

  assert.strictEqual(res.approved, false);
  assert.strictEqual(res.status, 'REJECTED');
  assert.strictEqual(res.key1.passed, false);
  assert.strictEqual(res.key2.approved, true);
  assert.ok(res.notes.includes('Key 1 failure'));

  const formatted = gate.formatVerdict(res);
  assert.ok(formatted.includes('[REJECTED]'));
  assert.ok(formatted.includes('Key1(Verifier)=FAIL'));
  assert.ok(formatted.includes('Key2(Auditor)=PASS'));
});

test('ConsensusGate rejects when auditor rejects', () => {
  const gate = new ConsensusGate();
  const res = gate.evaluate({
    verifierResult: { passed: true, reason: 'Tests green' },
    auditorResult: { approved: false, reason: 'Found file > 200 LOC' }
  });

  assert.strictEqual(res.approved, false);
  assert.strictEqual(res.status, 'REJECTED');
  assert.strictEqual(res.key1.passed, true);
  assert.strictEqual(res.key2.approved, false);
  assert.ok(res.notes.includes('Key 2 failure'));

  const formatted = gate.formatVerdict(res);
  assert.ok(formatted.includes('[REJECTED]'));
  assert.ok(formatted.includes('Key1(Verifier)=PASS'));
  assert.ok(formatted.includes('Key2(Auditor)=FAIL'));
});

test('ConsensusGate handles positional arguments', () => {
  const gate = new ConsensusGate();
  const res = gate.evaluate(
    { passed: true, reason: 'ok' },
    { approved: true, reason: 'ok' }
  );

  assert.strictEqual(res.approved, true);
  assert.strictEqual(res.status, 'APPROVED');
});

test('ConsensusGate handles empty or missing inputs gracefully', () => {
  const gate = new ConsensusGate();
  const res = gate.evaluate({});

  assert.strictEqual(res.approved, false);
  assert.strictEqual(res.status, 'PENDING');
  assert.strictEqual(res.key1.passed, false);
  assert.strictEqual(res.key2.approved, false);
});
