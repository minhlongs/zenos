'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { AgentSupervisor } = require('../src/workflow/agent-supervisor');

test('AgentSupervisor - registers, beats, and unregisters tasks', () => {
  const supervisor = new AgentSupervisor({ heartbeatIntervalMs: 1000, deadManTimeoutMs: 5000 });
  const task = supervisor.registerActiveTask('task_123', { pgid: 9999 });

  assert.equal(task.taskId, 'task_123');
  assert.equal(supervisor.getStatus().activeCount, 1);

  const beatRes = supervisor.recordHeartbeat('task_123');
  assert.equal(beatRes, true);

  const unregRes = supervisor.unregisterActiveTask('task_123');
  assert.equal(unregRes, true);
  assert.equal(supervisor.getStatus().activeCount, 0);
});

test('AgentSupervisor - dead-man switch triggers when heartbeat expires', async () => {
  let statusUpdated = false;
  let goalTransitioned = false;

  const mockTaskStore = {
    updateTaskStatus: (id, status) => {
      if (id === 'task_dead' && status === 'interrupted') {
        statusUpdated = true;
      }
    }
  };

  const mockGoalManager = {
    getStatus: (id) => ({ id, state: 'COOKING' }),
    transitionTo: (id, state) => {
      if (id === 'task_dead' && state === 'FAILED') {
        goalTransitioned = true;
      }
    }
  };

  const supervisor = new AgentSupervisor({
    taskStore: mockTaskStore,
    goalManager: mockGoalManager,
    heartbeatIntervalMs: 50,
    deadManTimeoutMs: 100
  });

  supervisor.registerActiveTask('task_dead', {});
  // Simulate time passage
  const task = supervisor.activeTasks.get('task_dead');
  task.lastHeartbeat = Date.now() - 200;

  supervisor.heartbeatPulse();

  assert.equal(statusUpdated, true);
  assert.equal(goalTransitioned, true);
  assert.equal(supervisor.getStatus().activeCount, 0);
});

test('AgentSupervisor - reconcileOnBoot calls taskStore and kills orphaned jails', () => {
  let recoverCalled = false;
  const mockTaskStore = {
    recoverDanglingTasks: () => {
      recoverCalled = true;
      return 3;
    }
  };

  const supervisor = new AgentSupervisor({ taskStore: mockTaskStore });
  const res = supervisor.reconcileOnBoot();

  assert.equal(recoverCalled, true);
  assert.equal(res.recoveredTasks, 3);
  assert.equal(supervisor.getStatus().bootReconciledCount, 3);
});
