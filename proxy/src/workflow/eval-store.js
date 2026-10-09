'use strict';

class EvalStore {
  constructor(db) {
    this.db = db;
    this.initTables();
  }

  initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS eval_runs (
        id TEXT PRIMARY KEY,
        suite_id TEXT NOT NULL,
        total_cases INTEGER NOT NULL,
        passed_cases INTEGER NOT NULL,
        pass_at_1 REAL NOT NULL,
        recovery_rate REAL NOT NULL,
        avg_latency_ms REAL NOT NULL,
        total_tokens INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS eval_cases (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        benchmark_id TEXT NOT NULL,
        initial_pass INTEGER NOT NULL,
        final_pass INTEGER NOT NULL,
        repair_attempts INTEGER NOT NULL,
        critique_summary TEXT,
        duration_ms INTEGER NOT NULL,
        FOREIGN KEY (run_id) REFERENCES eval_runs(id) ON DELETE CASCADE
      );
    `);
  }

  recordRun(run) {
    const stmt = this.db.prepare(`
      INSERT INTO eval_runs (id, suite_id, total_cases, passed_cases, pass_at_1, recovery_rate, avg_latency_ms, total_tokens, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      run.id,
      run.suiteId || 'standard_suite',
      run.totalCases || 0,
      run.passedCases || 0,
      run.passAt1 || 0,
      run.recoveryRate || 0,
      run.avgLatencyMs || 0,
      run.totalTokens || 0,
      run.createdAt || new Date().toISOString()
    );
    return run;
  }

  recordCase(evalCase) {
    const stmt = this.db.prepare(`
      INSERT INTO eval_cases (id, run_id, benchmark_id, initial_pass, final_pass, repair_attempts, critique_summary, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      evalCase.id,
      evalCase.runId,
      evalCase.benchmarkId,
      evalCase.initialPass ? 1 : 0,
      evalCase.finalPass ? 1 : 0,
      evalCase.repairAttempts || 0,
      evalCase.critiqueSummary || null,
      evalCase.durationMs || 0
    );
    return evalCase;
  }

  getRun(runId) {
    const run = this.db.prepare('SELECT * FROM eval_runs WHERE id = ?').get(runId);
    if (!run) return null;
    const cases = this.db.prepare('SELECT * FROM eval_cases WHERE run_id = ?').all(runId);
    return {
      ...run,
      cases: cases.map(c => ({
        ...c,
        initialPass: Boolean(c.initial_pass),
        finalPass: Boolean(c.final_pass)
      }))
    };
  }

  listRuns(limit = 20) {
    return this.db.prepare('SELECT * FROM eval_runs ORDER BY created_at DESC LIMIT ?').all(limit);
  }
}

module.exports = { EvalStore };
