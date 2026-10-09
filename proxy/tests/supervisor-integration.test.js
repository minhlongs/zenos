'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const http = require('node:http');
const { createFactoryRouter } = require('../src/workflow/routes-factory');
const { CookRunner } = require('../src/workflow/cook-runner');

function startTestServer(router) {
  const app = express();
  app.use(express.json());
  app.use('/v1/factory', router);

  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${port}/v1/factory`
      });
    });
  });
}

test('supervisor integration - GET /supervisor/status returns valid payload', async () => {
  const router = createFactoryRouter();
  const { server, baseUrl } = await startTestServer(router);

  try {
    const res = await fetch(`${baseUrl}/supervisor/status`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.ok(data.supervisor);
    assert.equal(typeof data.supervisor.activeCount, 'number');
    assert.ok(Array.isArray(data.supervisor.activeJails));
  } finally {
    server.close();
  }
});

test('supervisor integration - POST /goal registers active task in supervisor', async () => {
  const router = createFactoryRouter();
  const { server, baseUrl } = await startTestServer(router);

  try {
    const goalRes = await fetch(`${baseUrl}/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalId: 'goal_sup_1', title: 'Test Supervisor Goal' })
    });
    assert.equal(goalRes.status, 201);

    const supRes = await fetch(`${baseUrl}/supervisor/status`);
    const supData = await supRes.json();
    assert.ok(supData.supervisor.activeCount >= 1);
    assert.ok(supData.supervisor.activeTasks.some(t => t.taskId === 'goal_sup_1'));
  } finally {
    server.close();
  }
});

test('supervisor integration - POST /supervisor/kill-all executes smoothly', async () => {
  const router = createFactoryRouter();
  const { server, baseUrl } = await startTestServer(router);

  try {
    const res = await fetch(`${baseUrl}/supervisor/kill-all`, { method: 'POST' });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(typeof data.killedCount, 'number');
  } finally {
    server.close();
  }
});

test('CookRunner.runCycleAsync runs with ProcessJail and succeeds', async () => {
  const runner = new CookRunner();
  const res = await runner.runCycleAsync({
    testCommand: 'node -e "process.exit(0)"',
    targetFiles: []
  });

  assert.equal(res.success, true);
  assert.equal(res.state, 'PASSED');
  assert.equal(res.iterations, 1);
});
