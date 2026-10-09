'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const { TelemetryCollector } = require('../src/telemetry');
const { ApprovalGate } = require('../src/approval-gate');
const { createDashboardRouter } = require('../src/routes-dashboard');

describe('Embedded Proxy Dashboard (Gate 5)', () => {
  it('serves dashboard HTML with 200 OK and proper content type', async () => {
    const telemetry = new TelemetryCollector();
    const approvalGate = new ApprovalGate();

    const app = express();
    app.use('/dashboard', createDashboardRouter({ telemetry, approvalGate }));

    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/dashboard`);
      assert.equal(res.status, 200);
      assert.ok(res.headers.get('content-type').includes('text/html'));
      const text = await res.text();
      assert.ok(text.includes('ZenOS Operational Dashboard'));
      assert.ok(text.includes('/v1/telemetry/events'));
      assert.ok(text.includes('Approval Queue'));
    } finally {
      server.close();
    }
  });

  it('provides status JSON endpoint for dashboard initialization', async () => {
    const telemetry = new TelemetryCollector();
    const approvalGate = new ApprovalGate();
    approvalGate.createRequest({ action: 'DANGEROUS_OP', command: 'rm -rf test' });

    const app = express();
    app.use('/dashboard', createDashboardRouter({ telemetry, approvalGate }));

    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/dashboard/api/overview`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.telemetry);
      assert.ok(Array.isArray(data.approvals));
      assert.equal(data.approvals.length, 1);
    } finally {
      server.close();
    }
  });
});
