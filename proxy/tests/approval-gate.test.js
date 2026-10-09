'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ApprovalGate, APPROVAL_STATUS } = require('../src/approval-gate');

describe('Human Approval Engine (Gate 4)', () => {
  it('creates an approval request with token and pending status', () => {
    const gate = new ApprovalGate();
    const req = gate.createRequest({
      action: 'DELETE_DIRECTORY',
      command: 'rm -rf node_modules',
      context: 'Clean build directory',
      ttlSeconds: 60
    });

    assert.ok(req.id);
    assert.ok(req.token);
    assert.equal(req.status, APPROVAL_STATUS.PENDING);
    assert.equal(req.action, 'DELETE_DIRECTORY');
    assert.equal(gate.isApproved(req.id), false);
  });

  it('approves a request with valid token', () => {
    const gate = new ApprovalGate();
    const req = gate.createRequest({
      action: 'GIT_RESET_HARD',
      command: 'git reset --hard HEAD~1'
    });

    const resolved = gate.resolve(req.id, {
      token: req.token,
      approved: true,
      decidedBy: 'human_operator'
    });

    assert.equal(resolved.status, APPROVAL_STATUS.APPROVED);
    assert.equal(resolved.decidedBy, 'human_operator');
    assert.equal(gate.isApproved(req.id), true);
  });

  it('rejects an approval when rejected by operator', () => {
    const gate = new ApprovalGate();
    const req = gate.createRequest({
      action: 'PURGE_CACHE',
      command: 'rm -rf .cache'
    });

    const resolved = gate.resolve(req.id, {
      token: req.token,
      approved: false,
      decidedBy: 'security_auditor'
    });

    assert.equal(resolved.status, APPROVAL_STATUS.REJECTED);
    assert.equal(gate.isApproved(req.id), false);
  });

  it('rejects decision with invalid token', () => {
    const gate = new ApprovalGate();
    const req = gate.createRequest({
      action: 'CHMOD_RECURSIVE',
      command: 'chmod -R 777 /app'
    });

    assert.throws(() => {
      gate.resolve(req.id, {
        token: 'invalid_token_123',
        approved: true
      });
    }, /Invalid approval token/);
  });

  it('handles TTL expiration automatically', () => {
    const gate = new ApprovalGate();
    const req = gate.createRequest({
      action: 'QUICK_EXPIRE',
      ttlSeconds: -1 // Already expired
    });

    const status = gate.getStatus(req.id);
    assert.equal(status.status, APPROVAL_STATUS.EXPIRED);
    assert.equal(gate.isApproved(req.id), false);
  });
});
