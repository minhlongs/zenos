'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { EventEmitter } = require('node:events');
const { EvalBenchmarkSuite } = require('./eval-benchmarks.js');
const { ReflexionLoop } = require('./reflexion-loop.js');
const { ProcessJail } = require('./process-jail.js');

class EvalRunner extends EventEmitter {
  constructor(options = {}) {
    super();
    this.suite = options.suite || new EvalBenchmarkSuite();
    this.evalStore = options.evalStore || null;
    this.modelClient = options.modelClient || null;
    this.concurrencyGate = options.concurrencyGate || null;
    this.processJail = options.processJail || new ProcessJail();
    this.maxRetries = options.maxRetries || 2;
  }

  async runBenchmark(benchmarkId, options = {}) {
    const benchmark = this.suite.get(benchmarkId);
    if (!benchmark) throw new Error(`Benchmark ${benchmarkId} not found`);

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `eval-${benchmarkId}-`));
    const startTime = Date.now();
    this.emit('eval_case_start', { benchmarkId, title: benchmark.title });

    try {
      this.suite.createWorkspace(benchmarkId, tmpDir);

      const runVerifier = async () => {
        const jail = new ProcessJail({ defaultTimeoutMs: 15000 });
        const res = await jail.run('node', ['--test', 'test.js'], { cwd: tmpDir, shell: false });
        return {
          success: res.exitCode === 0,
          exitCode: res.exitCode,
          stdout: res.stdout,
          stderr: res.stderr || res.stdout,
          output: `${res.stdout}\n${res.stderr}`
        };
      };

      const loop = new ReflexionLoop({
        workspaceRoot: tmpDir,
        modelClient: this.modelClient,
        concurrencyGate: this.concurrencyGate,
        maxRetries: options.maxRetries !== undefined ? options.maxRetries : this.maxRetries
      });

      const outcome = await loop.run({
        task: benchmark.task,
        targetFile: benchmark.targetFile,
        runVerifier
      });

      const durationMs = Date.now() - startTime;
      const lastHistory = outcome.history && outcome.history.length > 1
        ? outcome.history[outcome.history.length - 1]
        : null;

      const caseResult = {
        benchmarkId,
        initialPass: outcome.initialPassed,
        finalPass: outcome.finalPassed,
        repairAttempts: outcome.attempts,
        critiqueSummary: lastHistory ? lastHistory.critique : null,
        durationMs
      };

      this.emit('eval_case_complete', caseResult);
      return caseResult;
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  async runSuite(options = {}) {
    const list = options.benchmarkIds || this.suite.list().map(b => b.id);
    const runId = `eval_${Date.now()}`;
    const startTime = Date.now();
    this.emit('eval_start', { runId, totalCases: list.length });

    const cases = [];
    for (const bId of list) {
      const caseRes = await this.runBenchmark(bId, options);
      caseRes.runId = runId;
      caseRes.id = `case_${bId}_${Date.now()}`;
      cases.push(caseRes);
    }

    const totalCases = cases.length;
    const passedCases = cases.filter(c => c.finalPass).length;
    const initialPassed = cases.filter(c => c.initialPass).length;
    const repairedCases = cases.filter(c => !c.initialPass && c.finalPass).length;
    const failedInitial = totalCases - initialPassed;

    const passAt1 = totalCases > 0 ? Number((initialPassed / totalCases).toFixed(2)) : 0;
    const recoveryRate = failedInitial > 0 ? Number((repairedCases / failedInitial).toFixed(2)) : 0;
    const totalLatency = cases.reduce((acc, c) => acc + c.durationMs, 0);
    const avgLatencyMs = totalCases > 0 ? Math.round(totalLatency / totalCases) : 0;

    const runSummary = {
      id: runId,
      suiteId: options.suiteId || 'standard_suite',
      totalCases,
      passedCases,
      passAt1,
      recoveryRate,
      avgLatencyMs,
      totalTokens: 0,
      createdAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      cases
    };

    if (this.evalStore) {
      this.evalStore.recordRun(runSummary);
      for (const c of cases) {
        this.evalStore.recordCase(c);
      }
    }

    this.emit('eval_summary', runSummary);
    return runSummary;
  }
}

module.exports = { EvalRunner };
