'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { initDatabase } = require('../src/db');
const { TaskStore } = require('../src/task-store');

describe('TaskStore & Session Management', () => {
  it('creates and manages session lifecycles', () => {
    const db = initDatabase({ memory: true });
    const store = new TaskStore(db);

    const session = store.createSession({
      id: 'sess-1',
      title: 'Auditing ZenOS',
      model: 'qwen2.5-coder-7b'
    });

    assert.equal(session.id, 'sess-1');
    assert.equal(session.title, 'Auditing ZenOS');

    const fetched = store.getSession('sess-1');
    assert.equal(fetched.id, 'sess-1');
    assert.equal(fetched.model, 'qwen2.5-coder-7b');
  });

  it('creates tasks, tracks status transitions, and enforces valid states', () => {
    const db = initDatabase({ memory: true });
    const store = new TaskStore(db);

    store.createSession({ id: 'sess-2', title: 'Task Test' });
    const task = store.createTask({
      id: 'task-1',
      sessionId: 'sess-2',
      name: 'Run Lint'
    });

    assert.equal(task.status, 'pending');

    store.updateTaskStatus('task-1', 'running');
    assert.equal(store.getTask('task-1').status, 'running');

    store.updateTaskStatus('task-1', 'completed', { output: 'All lint passed' });
    const completed = store.getTask('task-1');
    assert.equal(completed.status, 'completed');
    assert.equal(completed.output, 'All lint passed');
  });

  it('recovers dangling running tasks on startup by transitioning to interrupted', () => {
    const db = initDatabase({ memory: true });
    const store = new TaskStore(db);

    store.createSession({ id: 'sess-3', title: 'Interruption Test' });
    store.createTask({ id: 'task-dangling-1', sessionId: 'sess-3', name: 'Building' });
    store.createTask({ id: 'task-dangling-2', sessionId: 'sess-3', name: 'Testing' });

    store.updateTaskStatus('task-dangling-1', 'running');
    store.updateTaskStatus('task-dangling-2', 'running');

    const recoveredCount = store.recoverDanglingTasks();
    assert.equal(recoveredCount, 2);

    assert.equal(store.getTask('task-dangling-1').status, 'interrupted');
    assert.equal(store.getTask('task-dangling-2').status, 'interrupted');
  });
});
