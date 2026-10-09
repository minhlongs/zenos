'use strict';

const EventEmitter = require('node:events');

const GOAL_STATES = {
  IDLE: 'IDLE',
  PLANNING: 'PLANNING',
  COOKING: 'COOKING',
  VERIFYING: 'VERIFYING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

const ALLOWED_TRANSITIONS = {
  [GOAL_STATES.IDLE]: [GOAL_STATES.PLANNING, GOAL_STATES.FAILED],
  [GOAL_STATES.PLANNING]: [GOAL_STATES.COOKING, GOAL_STATES.PAUSED, GOAL_STATES.FAILED],
  [GOAL_STATES.COOKING]: [GOAL_STATES.VERIFYING, GOAL_STATES.PAUSED, GOAL_STATES.FAILED],
  [GOAL_STATES.VERIFYING]: [GOAL_STATES.COMPLETED, GOAL_STATES.COOKING, GOAL_STATES.PAUSED, GOAL_STATES.FAILED],
  [GOAL_STATES.PAUSED]: [GOAL_STATES.PLANNING, GOAL_STATES.COOKING, GOAL_STATES.VERIFYING, GOAL_STATES.FAILED],
  [GOAL_STATES.COMPLETED]: [],
  [GOAL_STATES.FAILED]: []
};

class GoalManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.taskStore = options.taskStore || null;
    this.goals = new Map();
  }

  startGoal(goalId, { title = 'Untitled Goal', spec = {} } = {}) {
    if (!goalId) throw new Error('goalId is required');
    if (this.goals.has(goalId)) throw new Error(`Goal ${goalId} already exists`);

    const goal = {
      id: goalId,
      title,
      spec,
      state: GOAL_STATES.IDLE,
      previousState: null,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.goals.set(goalId, goal);
    this.transitionTo(goalId, GOAL_STATES.PLANNING, { reason: 'Goal initialized' });
    return this.getStatus(goalId);
  }

  transitionTo(goalId, nextState, { reason = '', artifacts = null } = {}) {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error(`Goal ${goalId} not found`);

    if (!GOAL_STATES[nextState]) {
      throw new Error(`Invalid goal state: ${nextState}`);
    }

    const allowed = ALLOWED_TRANSITIONS[goal.state] || [];
    if (!allowed.includes(nextState)) {
      throw new Error(`Illegal state transition from ${goal.state} to ${nextState}`);
    }

    const previousState = goal.state;
    goal.previousState = previousState;
    goal.state = nextState;
    goal.updatedAt = new Date().toISOString();

    const transitionRecord = {
      from: previousState,
      to: nextState,
      reason,
      artifacts,
      timestamp: goal.updatedAt
    };
    goal.history.push(transitionRecord);

    if (this.taskStore && typeof this.taskStore.saveCheckpoint === 'function') {
      try {
        this.taskStore.saveCheckpoint({
          taskId: goalId,
          phase: nextState,
          state: nextState,
          artifacts: { reason, ...(artifacts || {}) }
        });
      } catch {
        // Fallback or ignore if task does not exist in SQLite
      }
    }

    this.emit('transition', { goalId, from: previousState, to: nextState, reason, artifacts });
    return goal;
  }

  pause(goalId, reason = 'Operator pause') {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error(`Goal ${goalId} not found`);
    return this.transitionTo(goalId, GOAL_STATES.PAUSED, { reason });
  }

  resume(goalId) {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error(`Goal ${goalId} not found`);
    if (goal.state !== GOAL_STATES.PAUSED) {
      throw new Error(`Cannot resume goal in state ${goal.state}`);
    }
    const targetState = goal.previousState || GOAL_STATES.PLANNING;
    return this.transitionTo(goalId, targetState, { reason: 'Resumed from pause' });
  }

  abort(goalId, reason = 'Operator abort') {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error(`Goal ${goalId} not found`);
    return this.transitionTo(goalId, GOAL_STATES.FAILED, { reason });
  }

  getStatus(goalId) {
    const goal = this.goals.get(goalId);
    if (!goal) return null;
    return { ...goal, history: [...goal.history] };
  }

  listGoals() {
    return Array.from(this.goals.values()).map(g => ({ ...g }));
  }
}

module.exports = { GoalManager, GOAL_STATES, ALLOWED_TRANSITIONS };
