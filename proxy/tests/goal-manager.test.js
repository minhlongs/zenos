'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { initDatabase } = require('../src/db');
const { TaskStore } = require('../src/task-store');
const { GoalManager, GOAL_STATES } = require('../src/workflow/goal-manager');

test('goal-manager: full lifecycle transitions', () => {
  const db = initDatabase({ memory: true });
  const store = new TaskStore(db);
  const manager = new GoalManager({ taskStore: store });

  const task = store.createTask({ name: 'Ship Feature X' });
  const goal = manager.startGoal(task.id, { title: 'Feature X', spec: { scope: 'full' } });

  assert.equal(goal.state, GOAL_STATES.PLANNING);
  assert.equal(goal.history.length, 1);

  manager.transitionTo(task.id, GOAL_STATES.COOKING, { reason: 'Plan approved' });
  assert.equal(manager.getStatus(task.id).state, GOAL_STATES.COOKING);

  manager.transitionTo(task.id, GOAL_STATES.VERIFYING, { reason: 'Cook finished' });
  assert.equal(manager.getStatus(task.id).state, GOAL_STATES.VERIFYING);

  manager.transitionTo(task.id, GOAL_STATES.COMPLETED, { reason: 'All tests green' });
  const finalGoal = manager.getStatus(task.id);
  assert.equal(finalGoal.state, GOAL_STATES.COMPLETED);
  assert.equal(finalGoal.history.length, 4);

  const checkpoints = store.listCheckpoints(task.id);
  assert.equal(checkpoints.length, 4);
  assert.equal(checkpoints[0].phase, GOAL_STATES.COMPLETED);
});

test('goal-manager: pause and resume cycle', () => {
  const manager = new GoalManager();
  const goalId = 'goal_pause_test';
  manager.startGoal(goalId, { title: 'Pause Test' });
  manager.transitionTo(goalId, GOAL_STATES.COOKING);

  manager.pause(goalId, 'Waiting for operator review');
  assert.equal(manager.getStatus(goalId).state, GOAL_STATES.PAUSED);

  manager.resume(goalId);
  assert.equal(manager.getStatus(goalId).state, GOAL_STATES.COOKING);
});

test('goal-manager: aborts cleanly to FAILED', () => {
  const manager = new GoalManager();
  const goalId = 'goal_abort_test';
  manager.startGoal(goalId);
  manager.abort(goalId, 'High risk command rejected');
  assert.equal(manager.getStatus(goalId).state, GOAL_STATES.FAILED);
});

test('goal-manager: rejects illegal transition', () => {
  const manager = new GoalManager();
  const goalId = 'goal_illegal_test';
  manager.startGoal(goalId);
  assert.throws(() => {
    manager.transitionTo(goalId, GOAL_STATES.COMPLETED);
  }, /Illegal state transition/);
});
