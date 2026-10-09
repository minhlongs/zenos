'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { initDatabase } = require('../src/db');
const { TaskStore } = require('../src/task-store');

test('task-checkpoints: save and retrieve latest checkpoint', () => {
  const db = initDatabase({ memory: true });
  const store = new TaskStore(db);

  const task = store.createTask({ name: 'Cook TDD Task', input: { goal: 'build parser' } });
  assert.ok(task.id);

  const chk1 = store.saveCheckpoint({
    taskId: task.id,
    phase: 'RED',
    state: 'TEST_FAILING',
    artifacts: { testFile: 'parser.test.js', exitCode: 1 }
  });

  assert.ok(chk1.id.startsWith('chk_'));
  assert.equal(chk1.phase, 'RED');
  assert.equal(chk1.state, 'TEST_FAILING');
  assert.equal(chk1.artifacts.testFile, 'parser.test.js');

  const chk2 = store.saveCheckpoint({
    taskId: task.id,
    phase: 'GREEN',
    state: 'TEST_PASSING',
    artifacts: { codeFile: 'parser.js', exitCode: 0 }
  });

  const latest = store.getLatestCheckpoint(task.id);
  assert.equal(latest.id, chk2.id);
  assert.equal(latest.phase, 'GREEN');
  assert.equal(latest.state, 'TEST_PASSING');
  assert.equal(latest.artifacts.codeFile, 'parser.js');

  const list = store.listCheckpoints(task.id);
  assert.equal(list.length, 2);
  assert.equal(list[0].id, chk2.id);
  assert.equal(list[1].id, chk1.id);
});

test('task-checkpoints: validation on required fields', () => {
  const db = initDatabase({ memory: true });
  const store = new TaskStore(db);

  assert.throws(() => {
    store.saveCheckpoint({ taskId: null, phase: 'RED', state: 'TEST' });
  }, /taskId, phase, and state are required/);

  assert.throws(() => {
    store.saveCheckpoint({ taskId: '123', phase: null, state: 'TEST' });
  }, /taskId, phase, and state are required/);
});
