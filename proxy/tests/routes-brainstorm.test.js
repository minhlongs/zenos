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

  await t.test('POST /start initiates brainstorming session', async () => {
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
