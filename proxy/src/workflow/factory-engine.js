'use strict';

const EventEmitter = require('node:events');
const { ZenDirector } = require('./zen-director');
const { CookRunner } = require('./cook-runner');
const { GoalManager, GOAL_STATES } = require('./goal-manager');

class FactoryEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.taskStore = options.taskStore || null;
    this.concurrencyGate = options.concurrencyGate || null;
    this.approvalGate = options.approvalGate || null;
    this.zenDirector = options.zenDirector || new ZenDirector();
    this.cookRunner = options.cookRunner || new CookRunner();
    this.goalManager = options.goalManager || new GoalManager({ taskStore: this.taskStore });

    // Bubble up goal manager events
    this.goalManager.on('transition', (evt) => this.emit('factory:transition', evt));
  }

  async executeGoal({
    goalId = `goal_${Date.now()}`,
    title = 'Automated Goal',
    prompt,
    fileHint,
    testCommand = 'node --test',
    targetFiles = [],
    context = {}
  } = {}) {
    if (!prompt) {
      throw new Error('prompt is required for goal execution');
    }

    // 1. Initialize Goal
    this.goalManager.startGoal(goalId, { title, spec: { prompt, fileHint, targetFiles } });

    // 2. Planning Phase with Zen Director
    let plan;
    if (this.concurrencyGate) {
      // Guard local inference under ConcurrencyGate
      plan = await this.concurrencyGate.enqueue(() =>
        Promise.resolve(this.zenDirector.planExecution(prompt, { fileHint, ...context }))
      );
    } else {
      plan = this.zenDirector.planExecution(prompt, { fileHint, ...context });
    }

    this.emit('factory:plan', { goalId, plan });

    // 3. Cooking Phase with Cook Runner
    this.goalManager.transitionTo(goalId, GOAL_STATES.COOKING, {
      reason: 'Plan generated, beginning TDD cycle',
      artifacts: { planId: plan.id }
    });

    const cookResult = this.cookRunner.runCycle({
      testCommand,
      targetFiles: targetFiles.length > 0 ? targetFiles : plan.suggestedSourceFiles
    });

    if (!cookResult.success) {
      this.goalManager.transitionTo(goalId, GOAL_STATES.FAILED, {
        reason: cookResult.error || 'Cook TDD cycle failed',
        artifacts: { cookResult }
      });
      return {
        goalId,
        status: GOAL_STATES.FAILED,
        plan,
        cookResult,
        error: cookResult.error
      };
    }

    // 4. Verifying Phase
    this.goalManager.transitionTo(goalId, GOAL_STATES.VERIFYING, {
      reason: 'Cook tests passed, validating invariants',
      artifacts: { cookResult }
    });

    // 5. Completion
    this.goalManager.transitionTo(goalId, GOAL_STATES.COMPLETED, {
      reason: 'All acceptance criteria and invariants satisfied',
      artifacts: { cookResult }
    });

    return {
      goalId,
      status: GOAL_STATES.COMPLETED,
      plan,
      cookResult
    };
  }

  getGoalStatus(goalId) {
    return this.goalManager.getStatus(goalId);
  }
}

module.exports = { FactoryEngine };
