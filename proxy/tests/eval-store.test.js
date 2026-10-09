'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { DatabaseSync } = require('node:sqlite');
const { EvalStore } = require('../src/workflow/eval-store.js');

test('EvalStore creates tables and persists runs and cases', () => {
  const db = new DatabaseSync(':memory:');
  const store = new EvalStore(db);

  const run = {
    id: 'run_101',
    suiteId: 'unit_test_suite',
    totalCases: 5,
    passedCases: 4,
    passAt1: 0.6,
    recoveryRate: 0.5,
    avgLatencyMs: 1200,
    totalTokens: 450,
    createdAt: new Date().toISOString()
  };

  store.recordRun(run);

  const evalCase = {
    id: 'case_101',
    runId: 'run_101',
    benchmarkId: 'bug_sort_null',
    initialPass: false,
    finalPass: true,
    repairAttempts: 1,
    critiqueSummary: 'Fix sort order for null values',
    durationMs: 800
  };

  store.recordCase(evalCase);

  const fetched = store.getRun('run_101');
  assert.strictEqual(fetched.id, 'run_101');
  assert.strictEqual(fetched.total_cases, 5);
  assert.strictEqual(fetched.pass_at_1, 0.6);
  assert.strictEqual(fetched.cases.length, 1);
  assert.strictEqual(fetched.cases[0].benchmark_id, 'bug_sort_null');
  assert.strictEqual(fetched.cases[0].finalPass, true);

  const list = store.listRuns();
  assert.strictEqual(list.length, 1);
});
