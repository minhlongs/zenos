'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const { createFactoryRouter } = require('../src/workflow/routes-factory');
const { ZenDirector } = require('../src/workflow/zen-director');
const { CookRunner } = require('../src/workflow/cook-runner');
const { GoalManager } = require('../src/workflow/goal-manager');

describe('Factory REST & SSE API (Gate 6)', () => {
  it('POST /v1/factory/zen generates plan from prompt', async () => {
    const app = express();
    app.use(express.json());
    app.use('/v1/factory', createFactoryRouter());

    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/v1/factory/zen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Create auth token validator', fileHint: 'token-validator' })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.plan);
      assert.equal(data.plan.strategy, 'TDD_STRICT');
      assert.equal(data.plan.phases.length, 3);
    } finally {
      server.close();
    }
  });

  it('POST /v1/factory/cook executes test cycle', async () => {
    const mockRunner = new CookRunner({
      runnerFn: () => ({ exitCode: 0, stdout: 'pass', stderr: '', durationMs: 5 })
    });
    const app = express();
    app.use(express.json());
    app.use('/v1/factory', createFactoryRouter({ cookRunner: mockRunner }));

    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/v1/factory/cook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCommand: 'node --test' })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.state, 'PASSED');
    } finally {
      server.close();
    }
  });

  it('POST & GET /v1/factory/goal manages lifecycle, pause, and resume', async () => {
    const goalManager = new GoalManager();
    const app = express();
    app.use(express.json());
    app.use('/v1/factory', createFactoryRouter({ goalManager }));

    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      // 1. Create goal
      const createRes = await fetch(`http://127.0.0.1:${port}/v1/factory/goal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId: 'goal_rest_1', title: 'Test Rest Goal' })
      });
      assert.equal(createRes.status, 201);
      const createData = await createRes.json();
      assert.equal(createData.goal.state, 'PLANNING');

      // 2. Pause
      const pauseRes = await fetch(`http://127.0.0.1:${port}/v1/factory/goal/goal_rest_1/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'testing pause' })
      });
      assert.equal(pauseRes.status, 200);
      const pauseData = await pauseRes.json();
      assert.equal(pauseData.goal.state, 'PAUSED');

      // 3. Resume
      const resumeRes = await fetch(`http://127.0.0.1:${port}/v1/factory/goal/goal_rest_1/resume`, {
        method: 'POST'
      });
      assert.equal(resumeRes.status, 200);
      const resumeData = await resumeRes.json();
      assert.equal(resumeData.goal.state, 'PLANNING');
    } finally {
      server.close();
    }
  });
});
