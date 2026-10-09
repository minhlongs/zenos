'use strict';

const express = require('express');
const { EvalBenchmarkSuite } = require('./eval-benchmarks');
const { EvalRunner } = require('./eval-runner');
const { EvalStore } = require('./eval-store');

function createEvalRouter(options = {}) {
  const router = express.Router();
  const suite = options.suite || new EvalBenchmarkSuite();
  const evalStore = options.evalStore || (options.db ? new EvalStore(options.db) : null);
  const broadcast = options.broadcast || (() => {});

  const runner = options.runner || new EvalRunner({
    suite,
    evalStore,
    modelClient: options.modelClient,
    concurrencyGate: options.concurrencyGate,
    maxRetries: options.maxRetries
  });

  runner.on('eval_start', (e) => broadcast('eval_start', e));
  runner.on('eval_case_start', (e) => broadcast('eval_case_start', e));
  runner.on('eval_case_complete', (e) => broadcast('eval_case_complete', e));
  runner.on('eval_summary', (e) => broadcast('eval_summary', e));

  router.get('/benchmarks', (req, res) => {
    return res.status(200).json({ benchmarks: suite.list() });
  });

  router.post('/run', async (req, res) => {
    const { benchmarkId, benchmarkIds, maxRetries, suiteId, wait } = req.body || {};
    let targetIds = benchmarkIds;
    if (!targetIds && benchmarkId) {
      targetIds = [benchmarkId];
    }

    if (wait || req.query.wait === 'true') {
      try {
        const summary = await runner.runSuite({ benchmarkIds: targetIds, maxRetries, suiteId });
        return res.status(200).json({ success: true, summary });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }

    const runId = `eval_${Date.now()}`;
    runner.runSuite({ benchmarkIds: targetIds, maxRetries, suiteId, runId }).catch((err) => {
      broadcast('eval_error', { runId, error: err.message });
    });

    return res.status(202).json({ runId, status: 'running' });
  });

  router.get('/runs', (req, res) => {
    if (!evalStore) {
      return res.status(200).json({ runs: [] });
    }
    const limit = parseInt(req.query.limit, 10) || 20;
    const runs = evalStore.listRuns(limit);
    return res.status(200).json({ runs });
  });

  router.get('/runs/:id', (req, res) => {
    if (!evalStore) {
      return res.status(404).json({ error: 'EvalStore not configured' });
    }
    const run = evalStore.getRun(req.params.id);
    if (!run) {
      return res.status(404).json({ error: 'Evaluation run not found' });
    }
    return res.status(200).json({ run });
  });

  return router;
}

module.exports = { createEvalRouter };
