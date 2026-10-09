'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { DatabaseSync } = require('node:sqlite');
const { EvalRunner } = require('../src/workflow/eval-runner.js');
const { EvalStore } = require('../src/workflow/eval-store.js');
const { EvalBenchmarkSuite } = require('../src/workflow/eval-benchmarks.js');

test('EvalRunner runs single benchmark without model client (initial failure)', async () => {
  const runner = new EvalRunner();
  const res = await runner.runBenchmark('bug_sort_null', { maxRetries: 0 });

  assert.strictEqual(res.benchmarkId, 'bug_sort_null');
  assert.strictEqual(res.initialPass, false);
  assert.strictEqual(res.finalPass, false);
  assert.strictEqual(res.repairAttempts, 0);
  assert.ok(res.durationMs > 0);
});

test('EvalRunner executes suite and computes summary metrics', async () => {
  const db = new DatabaseSync(':memory:');
  const store = new EvalStore(db);
  const suite = new EvalBenchmarkSuite([
    {
      id: 'mock_pass',
      title: 'Passing test',
      category: 'test',
      task: 'no-op',
      targetFile: 'foo.js',
      setupFiles: [
        { path: 'foo.js', content: 'module.exports = 1;' },
        { path: 'test.js', content: 'const { test } = require("node:test"); test("ok", () => {});' }
      ]
    }
  ]);

  const runner = new EvalRunner({ suite, evalStore: store });
  const summary = await runner.runSuite({ benchmarkIds: ['mock_pass'] });

  assert.strictEqual(summary.totalCases, 1);
  assert.strictEqual(summary.passedCases, 1);
  assert.strictEqual(summary.passAt1, 1);
  assert.strictEqual(summary.recoveryRate, 0);

  const stored = store.getRun(summary.id);
  assert.ok(stored);
  assert.strictEqual(stored.passed_cases, 1);
});
