'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const http = require('node:http');
const { createSwarmRouter } = require('../src/workflow/routes-swarm.js');
const { SwarmBlackboard } = require('../src/workflow/swarm-blackboard.js');
const { DatabaseSync } = require('node:sqlite');

function makeApp() {
  const app = express();
  app.use(express.json());
  const db = new DatabaseSync(':memory:');
  const blackboard = new SwarmBlackboard(db);
  const router = createSwarmRouter({ blackboard });
  app.use('/v1/factory/swarm', router);
  return { app, blackboard };
}

test('GET /sessions returns empty list initially', async () => {
  const { app } = makeApp();
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;

  const res = await fetch(`http://127.0.0.1:${port}/v1/factory/swarm/sessions`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.deepStrictEqual(data.sessions, []);

  server.close();
});

test('POST /run runs swarm flow synchronously with wait=true', async () => {
  const { app } = makeApp();
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;

  const res = await fetch(`http://127.0.0.1:${port}/v1/factory/swarm/run?wait=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ objective: 'Refactor telemetry module', maxRounds: 2 })
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.session.status, 'CONSENSUS_REACHED');

  const sessRes = await fetch(`http://127.0.0.1:${port}/v1/factory/swarm/sessions/${data.session.id}`);
  assert.strictEqual(sessRes.status, 200);
  const sessData = await sessRes.json();
  assert.strictEqual(sessData.session.objective, 'Refactor telemetry module');

  const artRes = await fetch(`http://127.0.0.1:${port}/v1/factory/swarm/sessions/${data.session.id}/artifacts`);
  assert.strictEqual(artRes.status, 200);
  const artData = await artRes.json();
  assert.strictEqual(artData.artifacts.length, 4);

  server.close();
});

test('POST /run rejects empty objective', async () => {
  const { app } = makeApp();
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;

  const res = await fetch(`http://127.0.0.1:${port}/v1/factory/swarm/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.strictEqual(res.status, 400);

  server.close();
});
