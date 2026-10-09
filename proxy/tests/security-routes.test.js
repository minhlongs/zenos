'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('../src/app');
const { ApprovalGate, APPROVAL_STATUS } = require('../src/approval-gate');

describe('Security and Approval REST Endpoints (Gate 4)', () => {
  let proxyServer;
  let proxyPort;
  let gate;

  before(async () => {
    gate = new ApprovalGate();
    const app = createApp({
      approvalGate: gate,
      memoryDb: true,
      upstreamUrls: ['http://127.0.0.1:1234']
    });
    proxyServer = http.createServer(app);
    await new Promise(r => proxyServer.listen(0, '127.0.0.1', r));
    proxyPort = proxyServer.address().port;
  });

  after(async () => {
    if (proxyServer) await new Promise(r => proxyServer.close(r));
  });

  it('POST /v1/security/evaluate evaluates command risk correctly', async () => {
    const res = await fetch(`http://127.0.0.1:${proxyPort}/v1/security/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'rm -rf node_modules' })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.tier, 'DANGEROUS');
    assert.equal(body.requiresApproval, true);
    assert.equal(body.blocked, false);
  });

  it('POST /v1/security/evaluate identifies blocked attack commands', async () => {
    const res = await fetch(`http://127.0.0.1:${proxyPort}/v1/security/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'rm -rf /' })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.tier, 'BLOCKED');
    assert.equal(body.blocked, true);
  });

  it('manages full lifecycle of human approval requests', async () => {
    // 1. Submit approval request
    const createRes = await fetch(`http://127.0.0.1:${proxyPort}/v1/approvals/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'GIT_CLEAN_FORCE',
        command: 'git clean -fd',
        context: 'Remove untracked artifacts'
      })
    });

    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    const { id, token, status } = created;
    assert.ok(id);
    assert.ok(token);
    assert.equal(status, APPROVAL_STATUS.PENDING);

    // 2. List active approvals
    const listRes = await fetch(`http://127.0.0.1:${proxyPort}/v1/approvals`);
    assert.equal(listRes.status, 200);
    const listBody = await listRes.json();
    assert.ok(Array.isArray(listBody.approvals));
    assert.ok(listBody.approvals.some(a => a.id === id));

    // 3. Resolve approval with valid token
    const resolveRes = await fetch(`http://127.0.0.1:${proxyPort}/v1/approvals/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        approved: true,
        decidedBy: 'lead_developer'
      })
    });

    assert.equal(resolveRes.status, 200);
    const resolved = await resolveRes.json();
    assert.equal(resolved.status, APPROVAL_STATUS.APPROVED);
    assert.equal(resolved.decidedBy, 'lead_developer');

    // 4. Verify status
    const getRes = await fetch(`http://127.0.0.1:${proxyPort}/v1/approvals/${id}`);
    assert.equal(getRes.status, 200);
    const statusBody = await getRes.json();
    assert.equal(statusBody.status, APPROVAL_STATUS.APPROVED);
  });

  it('returns 400 when resolving with missing or invalid token', async () => {
    const createRes = await fetch(`http://127.0.0.1:${proxyPort}/v1/approvals/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DANGEROUS_ACTION' })
    });
    const created = await createRes.json();

    const resolveRes = await fetch(`http://127.0.0.1:${proxyPort}/v1/approvals/${created.id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'wrong_token',
        approved: true
      })
    });

    assert.equal(resolveRes.status, 400);
    const body = await resolveRes.json();
    assert.ok(body.error);
  });
});
