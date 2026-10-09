'use strict';

const express = require('express');
const { ZenDirector } = require('./zen-director');
const { CookRunner } = require('./cook-runner');
const { GoalManager } = require('./goal-manager');
const { AgentSupervisor } = require('./agent-supervisor');
const { ProcessJail } = require('./process-jail');
const { ReactAgentLoop } = require('./react-agent-loop');
const { createEvalRouter } = require('./routes-eval');
const { createSwarmRouter } = require('./routes-swarm');

function createFactoryRouter(options = {}) {
  const router = express.Router();
  const zenDirector = options.zenDirector || new ZenDirector();
  const cookRunner = options.cookRunner || new CookRunner();
  const goalManager = options.goalManager || new GoalManager({ taskStore: options.taskStore });
  const agentSupervisor = options.agentSupervisor || new AgentSupervisor({
    taskStore: options.taskStore,
    goalManager
  });
  agentSupervisor.start();

  const sseClients = new Set();
  const broadcast = (type, payload) => {
    const data = `data: ${JSON.stringify({ type, payload, timestamp: new Date().toISOString() })}\n\n`;
    for (const client of sseClients) {
      client.write(data);
    }
  };

  goalManager.on('transition', (event) => broadcast('goal_state', event));
  agentSupervisor.on('heartbeat', (event) => broadcast('supervisor_heartbeat', event));
  agentSupervisor.on('boot_reconciled', (event) => broadcast('supervisor_reconcile', event));
  agentSupervisor.on('deadman_triggered', (event) => broadcast('supervisor_deadman', event));

  router.post('/zen', (req, res) => {
    const { prompt, fileHint, context = {} } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });
    const plan = zenDirector.planExecution(prompt, { fileHint, ...context });
    return res.status(200).json({ plan });
  });

  router.post('/cook', (req, res) => {
    const { testCommand, targetFiles = [], maxIterations } = req.body || {};
    const runner = maxIterations ? new CookRunner({ maxIterations }) : cookRunner;
    const result = runner.runCycle({ testCommand, targetFiles });
    return res.status(result.success ? 200 : 422).json(result);
  });

  router.post('/goal', (req, res) => {
    const { goalId, title, spec } = req.body || {};
    const id = goalId || `goal_${Date.now()}`;
    try {
      const goal = goalManager.startGoal(id, { title, spec });
      agentSupervisor.registerActiveTask(id, { goalId: id });
      return res.status(201).json({ goal });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  router.get('/goal/:id', (req, res) => {
    const goal = goalManager.getStatus(req.params.id);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    return res.status(200).json({ goal });
  });

  router.post('/goal/:id/pause', (req, res) => {
    try {
      const goal = goalManager.pause(req.params.id, req.body?.reason);
      return res.status(200).json({ goal });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  router.post('/goal/:id/resume', (req, res) => {
    try {
      const goal = goalManager.resume(req.params.id);
      return res.status(200).json({ goal });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  router.post('/goal/:id/abort', (req, res) => {
    try {
      const goal = goalManager.abort(req.params.id, req.body?.reason);
      agentSupervisor.unregisterActiveTask(req.params.id, { reason: 'aborted' });
      return res.status(200).json({ goal });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  router.get('/supervisor/status', (req, res) => {
    return res.status(200).json({ status: 'ok', supervisor: agentSupervisor.getStatus() });
  });

  router.post('/supervisor/kill-all', (req, res) => {
    const killed = ProcessJail.killAll('SIGKILL');
    broadcast('supervisor_kill_all', { killedCount: killed });
    return res.status(200).json({ success: true, killedCount: killed });
  });

  router.post('/agent/run', async (req, res) => {
    const { prompt, workspaceRoot, maxIterations = 8 } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    const loop = new ReactAgentLoop({
      modelClient: options.modelClient,
      concurrencyGate: options.concurrencyGate,
      taskStore: options.taskStore,
      supervisor: agentSupervisor,
      workspaceRoot: workspaceRoot || process.cwd(),
      maxIterations
    });

    loop.on('agent_start', (e) => broadcast('agent_start', e));
    loop.on('agent_thought', (e) => broadcast('agent_thought', e));
    loop.on('agent_tool_call', (e) => broadcast('agent_tool_call', e));
    loop.on('agent_tool_result', (e) => broadcast('agent_tool_result', e));
    loop.on('agent_complete', (e) => broadcast('agent_complete', e));
    loop.on('agent_error', (e) => broadcast('agent_error', e));

    const taskId = `agent_${Date.now()}`;
    // Run asynchronously
    loop.run({ prompt, taskId, maxIterations }).catch(() => {});
    return res.status(202).json({ taskId, status: 'running' });
  });

  router.get('/agent/:id', (req, res) => {
    if (!options.taskStore) {
      return res.status(501).json({ error: 'TaskStore not configured' });
    }
    const task = options.taskStore.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const checkpoints = options.taskStore.listCheckpoints(req.params.id, 20);
    return res.status(200).json({ task, checkpoints });
  });

  router.use('/eval', createEvalRouter({
    ...options,
    broadcast
  }));

  router.use('/swarm', createSwarmRouter({
    ...options,
    broadcast
  }));

  router.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);
    res.write(': connected\n\n');
    req.on('close', () => { sseClients.delete(res); });
  });

  return router;
}

module.exports = { createFactoryRouter };
