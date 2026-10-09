'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { EvalBenchmarkSuite } = require('../src/workflow/eval-benchmarks.js');

test('EvalBenchmarkSuite lists defined benchmarks', () => {
  const suite = new EvalBenchmarkSuite();
  const list = suite.list();
  assert.ok(list.length >= 4);
  assert.ok(list.some(b => b.id === 'bug_sort_null'));
  assert.ok(list.some(b => b.id === 'api_request_validator'));
});

test('EvalBenchmarkSuite creates workspace with initial files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-ws-'));
  const suite = new EvalBenchmarkSuite();
  const { benchmark } = suite.createWorkspace('bug_sort_null', tmpDir);

  assert.strictEqual(benchmark.id, 'bug_sort_null');
  assert.ok(fs.existsSync(path.join(tmpDir, 'sorter.js')));
  assert.ok(fs.existsSync(path.join(tmpDir, 'test.js')));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('EvalBenchmarkSuite throws when benchmark not found', () => {
  const suite = new EvalBenchmarkSuite();
  assert.throws(() => suite.createWorkspace('non_existent', '/tmp'), /not found/);
});
