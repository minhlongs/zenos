'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const { createFactoryRouter } = require('../src/workflow/routes-factory');
const { EvalBenchmarkSuite } = require('../src/workflow/eval-benchmarks');
const { EvalStore } = require('../src/workflow/eval-store');

test('Eval REST routes (/v1/factory/eval/*)', async () => {
  const db = new DatabaseSync(':memory:');
  const evalStore = new EvalStore(db);
  const suite = new EvalBenchmarkSuite([
    {
      id: 'mock_pass',
      title: 'Mock Pass',
      category: 'test',
      task: 'no-op',
      targetFile: 'mod.js',
      setupFiles: [
        { path: 'mod.js', content: 'module.exports = 42;' },
        { path: 'test.js', content: 'const { test } = require("node:test"); test("ok", () => {});' }
      ]
    }
  ]);

  const app = express();
  app.use(express.json());
  app.use('/v1/factory', createFactoryRouter({ suite, evalStore, db }));

  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/v1/factory/eval`;

  try {
    // 1. GET /benchmarks
    const bRes = await fetch(`${baseUrl}/benchmarks`);
    assert.strictEqual(bRes.status, 200);
    const bData = await bRes.json();
    assert.ok(Array.isArray(bData.benchmarks));
    assert.strictEqual(bData.benchmarks[0].id, 'mock_pass');

    // 2. POST /run with wait=true
    const runRes = await fetch(`${baseUrl}/run?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ benchmarkId: 'mock_pass', wait: true })
    });
    assert.strictEqual(runRes.status, 200);
    const runData = await runRes.json();
    assert.strictEqual(runData.success, true);
    assert.strictEqual(runData.summary.totalCases, 1);
    assert.strictEqual(runData.summary.passedCases, 1);

    const runId = runData.summary.id;

    // 3. GET /runs
    const listRes = await fetch(`${baseUrl}/runs`);
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert.ok(listData.runs.length >= 1);
    assert.strictEqual(listData.runs[0].id, runId);

    // 4. GET /runs/:id
    const detailRes = await fetch(`${baseUrl}/runs/${runId}`);
    assert.strictEqual(detailRes.status, 200);
    const detailData = await detailRes.json();
    assert.strictEqual(detailData.run.id, runId);
    assert.strictEqual(detailData.run.cases.length, 1);
    assert.strictEqual(detailData.run.cases[0].benchmark_id, 'mock_pass');

    // 5. GET /runs/invalid -> 404
    const notFoundRes = await fetch(`${baseUrl}/runs/non_existent_123`);
    assert.strictEqual(notFoundRes.status, 404);

    // 6. POST /run background (async 202)
    const bgRes = await fetch(`${baseUrl}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ benchmarkId: 'mock_pass' })
    });
    assert.strictEqual(bgRes.status, 202);
    const bgData = await bgRes.json();
    assert.strictEqual(bgData.status, 'running');
    assert.ok(bgData.runId.startsWith('eval_'));
  } finally {
    server.close();
  }
});
