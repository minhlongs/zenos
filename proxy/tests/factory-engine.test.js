'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { FactoryEngine } = require('../src/workflow/factory-engine');
const { CookRunner } = require('../src/workflow/cook-runner');
const { ConcurrencyGate } = require('../src/queue');
const { initDatabase } = require('../src/db');
const { TaskStore } = require('../src/task-store');

test('factory-engine: end-to-end execution of a successful goal', async () => {
  const db = initDatabase({ memory: true });
  const taskStore = new TaskStore(db);
  const task = taskStore.createTask({ name: 'Implement calculator' });

  const mockRunner = new CookRunner({
    runnerFn: () => ({ exitCode: 0, stdout: 'PASS', stderr: '', durationMs: 10 })
  });
  const concurrencyGate = new ConcurrencyGate(1);

  const engine = new FactoryEngine({
    taskStore,
    cookRunner: mockRunner,
    concurrencyGate
  });

  const res = await engine.executeGoal({
    goalId: task.id,
    title: 'Implement calculator',
    prompt: 'Create math calculator module',
    fileHint: 'calculator',
    testCommand: 'node --test'
  });

  assert.equal(res.status, 'COMPLETED');
  assert.ok(res.plan.id.startsWith('zen_plan_'));
  assert.equal(res.cookResult.success, true);

  const finalGoal = engine.getGoalStatus(task.id);
  assert.equal(finalGoal.state, 'COMPLETED');
  assert.equal(finalGoal.history.length, 4);

  const checkpoints = taskStore.listCheckpoints(task.id);
  assert.equal(checkpoints.length, 4);
});

test('factory-engine: marks goal as FAILED if cook cycle trips circuit breaker', async () => {
  const mockRunner = new CookRunner({
    maxIterations: 2,
    runnerFn: () => ({ exitCode: 1, stdout: '', stderr: 'AssertionError', durationMs: 5 })
  });

  const engine = new FactoryEngine({ cookRunner: mockRunner });

  const res = await engine.executeGoal({
    goalId: 'goal_fail_test',
    prompt: 'Implement broken feature',
    fileHint: 'broken'
  });

  assert.equal(res.status, 'FAILED');
  assert.equal(res.cookResult.success, false);
  assert.ok(res.error.includes('Circuit breaker tripped'));

  const goal = engine.getGoalStatus('goal_fail_test');
  assert.equal(goal.state, 'FAILED');
});
