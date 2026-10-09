'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('../src/app');

describe('E2E Factory Integration via Proxy App', () => {
  it('mounts and responds to /v1/factory endpoints through createApp', async () => {
    const app = createApp({ memoryDb: true });
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      // 1. POST /v1/factory/zen
      const zenRes = await fetch(`${baseUrl}/v1/factory/zen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Implement reactive state store with subscriptions',
          fileHint: 'store'
        })
      });
      assert.equal(zenRes.status, 200);
      const zenData = await zenRes.json();
      assert.ok(zenData.plan);
      assert.equal(zenData.plan.strategy, 'TDD_STRICT');

      // 2. POST /v1/factory/cook
      const cookRes = await fetch(`${baseUrl}/v1/factory/cook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testCommand: 'node -e "process.exit(0);"'
        })
      });
      assert.equal(cookRes.status, 200);
      const cookData = await cookRes.json();
      assert.equal(cookData.success, true);
      assert.equal(cookData.state, 'PASSED');

      // 3. POST /v1/factory/goal
      const goalRes = await fetch(`${baseUrl}/v1/factory/goal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: 'e2e_goal_42',
          title: 'E2E Test Milestone'
        })
      });
      assert.equal(goalRes.status, 201);
      const goalData = await goalRes.json();
      assert.equal(goalData.goal.state, 'PLANNING');

      // 4. POST /v1/factory/goal/:id/pause
      const pauseRes = await fetch(`${baseUrl}/v1/factory/goal/e2e_goal_42/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'testing pause in e2e' })
      });
      assert.equal(pauseRes.status, 200);
      const pauseData = await pauseRes.json();
      assert.equal(pauseData.goal.state, 'PAUSED');

      // 5. POST /v1/factory/goal/:id/resume
      const resumeRes = await fetch(`${baseUrl}/v1/factory/goal/e2e_goal_42/resume`, {
        method: 'POST'
      });
      assert.equal(resumeRes.status, 200);
      const resumeData = await resumeRes.json();
      assert.equal(resumeData.goal.state, 'PLANNING');

      // 6. GET /v1/factory/goal/:id
      const statusRes = await fetch(`${baseUrl}/v1/factory/goal/e2e_goal_42`);
      assert.equal(statusRes.status, 200);
      const statusData = await statusRes.json();
      assert.equal(statusData.goal.id, 'e2e_goal_42');

      // 7. GET /v1/factory/events (SSE)
      const controller = new AbortController();
      const sseRes = await fetch(`${baseUrl}/v1/factory/events`, {
        signal: controller.signal
      });
      assert.equal(sseRes.status, 200);
      assert.equal(sseRes.headers.get('content-type'), 'text/event-stream');
      controller.abort();
    } finally {
      server.close();
    }
  });
});
