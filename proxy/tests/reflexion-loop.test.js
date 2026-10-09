'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { ReflexionLoop } = require('../src/workflow/reflexion-loop.js');

test('ReflexionLoop terminates immediately if initial verification passes', async () => {
  const loop = new ReflexionLoop();
  const outcome = await loop.run({
    task: 'test task',
    targetFile: 'foo.js',
    runVerifier: async () => ({ success: true, exitCode: 0 })
  });

  assert.strictEqual(outcome.success, true);
  assert.strictEqual(outcome.initialPassed, true);
  assert.strictEqual(outcome.attempts, 0);
  assert.strictEqual(outcome.history.length, 1);
});

test('ReflexionLoop invokes self-correction and repairs code upon test failure', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reflexion-test-'));
  const targetFile = 'math.js';
  const filePath = path.join(tmpDir, targetFile);
  fs.writeFileSync(filePath, 'module.exports = { add: (a, b) => a - b };\n', 'utf8');

  let testCallCount = 0;
  const runVerifier = async () => {
    testCallCount++;
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('a + b')) {
      return { success: true, exitCode: 0 };
    }
    return {
      success: false,
      exitCode: 1,
      stderr: `AssertionError: expected add(1, 2) to equal 3, got -1\n  at test (${filePath}:1:10)`
    };
  };

  const mockModelClient = {
    createChatCompletion: async () => ({
      choices: [{
        message: {
          content: '```javascript\nmodule.exports = { add: (a, b) => a + b };\n```'
        }
      }]
    })
  };

  const loop = new ReflexionLoop({
    workspaceRoot: tmpDir,
    modelClient: mockModelClient,
    maxRetries: 2
  });

  const outcome = await loop.run({
    task: 'Fix math.add',
    targetFile,
    runVerifier
  });

  assert.strictEqual(outcome.success, true);
  assert.strictEqual(outcome.initialPassed, false);
  assert.strictEqual(outcome.finalPassed, true);
  assert.strictEqual(outcome.attempts, 1);
  assert.ok(fs.readFileSync(filePath, 'utf8').includes('a + b'));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
