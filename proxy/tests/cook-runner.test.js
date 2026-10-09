'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { CookRunner } = require('../src/workflow/cook-runner');

test('cook-runner: succeeds on first iteration when tests pass', () => {
  const runner = new CookRunner({
    runnerFn: () => ({ exitCode: 0, stdout: 'ok', stderr: '', durationMs: 15 })
  });

  const res = runner.runCycle({ testCommand: 'node --test' });
  assert.equal(res.success, true);
  assert.equal(res.iterations, 1);
  assert.equal(res.state, 'PASSED');
  assert.equal(res.history.length, 1);
  assert.equal(res.history[0].exitCode, 0);
});

test('cook-runner: recovers on iteration 3 (Red -> Green)', () => {
  let attempts = 0;
  const runner = new CookRunner({
    runnerFn: () => {
      attempts++;
      if (attempts < 3) {
        return { exitCode: 1, stdout: '', stderr: 'Test failed', durationMs: 10 };
      }
      return { exitCode: 0, stdout: 'All tests pass', stderr: '', durationMs: 12 };
    }
  });

  const res = runner.runCycle({ testCommand: 'node --test' });
  assert.equal(res.success, true);
  assert.equal(res.iterations, 3);
  assert.equal(res.state, 'PASSED');
  assert.equal(res.history.length, 3);
});

test('cook-runner: trips circuit breaker after 5 consecutive failures', () => {
  const runner = new CookRunner({
    maxIterations: 5,
    runnerFn: () => ({ exitCode: 1, stdout: '', stderr: 'Fatal failure', durationMs: 10 })
  });

  const res = runner.runCycle({ testCommand: 'node --test' });
  assert.equal(res.success, false);
  assert.equal(res.iterations, 5);
  assert.equal(res.state, 'CIRCUIT_BREAKER_TRIGGERED');
  assert.ok(res.error.includes('Circuit breaker tripped after 5 consecutive test failures'));
  assert.equal(res.history.length, 5);
});

test('cook-runner: rejects when target file violates < 200 LOC invariant', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cook-loc-test-'));
  const bigFile = path.join(tmpDir, 'bloated.js');
  fs.writeFileSync(bigFile, 'const a = 1;\n'.repeat(210));

  const runner = new CookRunner({
    runnerFn: () => ({ exitCode: 0, stdout: 'ok', stderr: '', durationMs: 10 })
  });

  const res = runner.runCycle({
    testCommand: 'node --test',
    targetFiles: [bigFile]
  });

  assert.equal(res.success, false);
  assert.equal(res.state, 'LOC_LIMIT_EXCEEDED');
  assert.ok(res.error.includes('exceeds 200 LOC'));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('cook-runner: runs callback and tracks history', () => {
  const actions = [];
  const runner = new CookRunner({
    runnerFn: () => ({ exitCode: 0, stdout: 'green', stderr: '', durationMs: 5 })
  });

  const res = runner.runCycle({
    testCommand: 'node --test',
    iterationCallback: (i) => actions.push(`iter_${i}`)
  });

  assert.equal(res.success, true);
  assert.deepEqual(actions, ['iter_1']);
});
