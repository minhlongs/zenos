'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const http = require('node:http');
const { createBrainstormRouter } = require('../src/workflow/routes-brainstorm');
const { BrainstormEngine } = require('../src/workflow/brainstorm-engine');

function startServer(router) {
  const app = express();
  app.use(express.json());
  app.use('/v1/factory/brainstorm', router);
  const server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port, url: `http://127.0.0.1:${port}/v1/factory/brainstorm` });
    });
  });
}

test('Brainstorm Router HTTP endpoints work as expected', async (t) => {
  const engine = new BrainstormEngine();
  const router = createBrainstormRouter({ brainstormEngine: engine });
  const { server, url } = await startServer(router);

  t.after(() => new Promise((resolve) => server.close(resolve)));

  let createdSessionId = '';

  await t.test('POST /start initiates standard 3-turn brainstorming session', async () => {
    const res = await fetch(`${url}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Decompose monolithic parser',
        targetFile: 'src/parser.js'
      })
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(typeof data.session, 'object');
    assert.equal(data.session.turns.length, 3);
    assert.equal(data.session.strategies.length >= 2, true);
    createdSessionId = data.session.id;
  });

  await t.test('POST /start with deep: true initiates 5-turn Socratic Cross-Examination', async () => {
    const res = await fetch(`${url}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Deep Modularization of router',
        targetFile: 'src/router.js',
        deep: true
      })
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.session.deep, true);
    assert.equal(data.session.turns.length, 5);
    assert.equal(typeof data.session.telemetry, 'object');
    assert.equal(typeof data.session.splitBlueprint, 'object');
  });

  await t.test('GET /inspect returns file inspection or top workspace hotspots', async () => {
    const fileRes = await fetch(`${url}/inspect?file=src/router.js`);
    assert.equal(fileRes.status, 200);
    const fileData = await fileRes.json();
    assert.equal(typeof fileData.inspection, 'object');
    assert.equal(fileData.inspection.totalLines > 0, true);

    const hotspotRes = await fetch(`${url}/inspect?limit=2`);
    assert.equal(hotspotRes.status, 200);
    const hotspotData = await hotspotRes.json();
    assert.equal(Array.isArray(hotspotData.hotspots), true);
    assert.equal(hotspotData.hotspots.length, 2);
  });

  await t.test('POST /auto-hotspots scans and executes deep sessions on top hotspots', async () => {
    const res = await fetch(`${url}/auto-hotspots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 2 })
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.count, 2);
    assert.equal(Array.isArray(data.sessions), true);
    assert.equal(data.sessions[0].turns.length, 5);
  });

  await t.test('GET /sessions returns session listing', async () => {
    const res = await fetch(`${url}/sessions`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(Array.isArray(data.sessions), true);
    assert.equal(data.sessions.length >= 1, true);
  });

  await t.test('GET /session/:id returns session details', async () => {
    const res = await fetch(`${url}/session/${createdSessionId}`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.session.id, createdSessionId);
    assert.equal(data.session.turns.length, 3);
  });

  await t.test('POST /dispatch-zen converts strategy to /zen plan', async () => {
    const res = await fetch(`${url}/dispatch-zen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: createdSessionId })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(typeof data.zenPlan, 'object');
    assert.equal(Array.isArray(data.zenPlan.steps), true);
  });
});
