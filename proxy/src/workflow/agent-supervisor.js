'use strict';

const EventEmitter = require('node:events');
const { ProcessJail } = require('./process-jail');

class AgentSupervisor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.taskStore = options.taskStore || null;
    this.goalManager = options.goalManager || null;
    this.heartbeatIntervalMs = options.heartbeatIntervalMs || 5000;
    this.deadManTimeoutMs = options.deadManTimeoutMs || 30000;
    this.activeTasks = new Map();
    this.bootReconciledCount = 0;
    this.lastHeartbeatTs = null;
    this.heartbeatTimer = null;
  }

  start() {
    if (this.heartbeatTimer) return;
    this.reconcileOnBoot();
    this.heartbeatTimer = setInterval(() => {
      this.heartbeatPulse();
    }, this.heartbeatIntervalMs);
    if (this.heartbeatTimer.unref) {
      this.heartbeatTimer.unref();
    }
  }

  stop() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  registerActiveTask(taskId, metadata = {}) {
    if (!taskId) throw new Error('taskId is required');
    const now = Date.now();
    const taskRecord = {
      taskId,
      metadata,
      jailId: metadata.jailId || null,
      pgid: metadata.pgid || null,
      registeredAt: now,
      lastHeartbeat: now
    };
    this.activeTasks.set(taskId, taskRecord);
    this.emit('task_registered', taskRecord);
    return taskRecord;
  }

  recordHeartbeat(taskId) {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.lastHeartbeat = Date.now();
      return true;
    }
    return false;
  }

  unregisterActiveTask(taskId, { reason = 'completed' } = {}) {
    const task = this.activeTasks.get(taskId);
    if (task) {
      this.activeTasks.delete(taskId);
      this.emit('task_unregistered', { taskId, reason });
      return true;
    }
    return false;
  }

  heartbeatPulse() {
    const now = Date.now();
    this.lastHeartbeatTs = new Date(now).toISOString();
    const deadTasks = [];

    for (const [taskId, task] of this.activeTasks.entries()) {
      const elapsed = now - task.lastHeartbeat;
      if (elapsed > this.deadManTimeoutMs) {
        deadTasks.push(task);
      }
    }

    for (const dead of deadTasks) {
      this.handleDeadMan(dead);
    }

    this.emit('heartbeat', {
      timestamp: this.lastHeartbeatTs,
      activeCount: this.activeTasks.size,
      deadCount: deadTasks.length
    });
  }

  handleDeadMan(task) {
    this.activeTasks.delete(task.taskId);

    if (task.jailId) {
      const jails = ProcessJail.getActiveJails();
      const target = jails.find(j => j.jailId === task.jailId);
      if (target) {
        ProcessJail.killAll('SIGKILL');
      }
    }

    if (this.taskStore && typeof this.taskStore.updateTaskStatus === 'function') {
      try {
        this.taskStore.updateTaskStatus(task.taskId, 'interrupted', {
          error: `Dead-man switch triggered: no heartbeat for ${this.deadManTimeoutMs}ms`
        });
      } catch {}
    }

    if (this.goalManager && typeof this.goalManager.getStatus === 'function') {
      const goal = this.goalManager.getStatus(task.taskId);
      if (goal && goal.state !== 'COMPLETED' && goal.state !== 'FAILED') {
        try {
          this.goalManager.transitionTo(task.taskId, 'FAILED', {
            reason: 'Supervisor dead-man timeout'
          });
        } catch {}
      }
    }

    this.emit('deadman_triggered', {
      taskId: task.taskId,
      elapsedMs: Date.now() - task.lastHeartbeat
    });
  }

  reconcileOnBoot() {
    let recovered = 0;
    if (this.taskStore && typeof this.taskStore.recoverDanglingTasks === 'function') {
      try {
        recovered = this.taskStore.recoverDanglingTasks();
      } catch {}
    }

    ProcessJail.killAll('SIGKILL');

    this.bootReconciledCount = recovered;
    this.emit('boot_reconciled', { recoveredTasks: recovered });
    return { recoveredTasks: recovered };
  }

  getStatus() {
    return {
      activeTasks: Array.from(this.activeTasks.values()).map(t => ({
        taskId: t.taskId,
        registeredAt: new Date(t.registeredAt).toISOString(),
        lastHeartbeat: new Date(t.lastHeartbeat).toISOString(),
        pgid: t.pgid
      })),
      activeCount: this.activeTasks.size,
      lastHeartbeat: this.lastHeartbeatTs,
      bootReconciledCount: this.bootReconciledCount,
      activeJails: ProcessJail.getActiveJails()
    };
  }
}

module.exports = { AgentSupervisor };
