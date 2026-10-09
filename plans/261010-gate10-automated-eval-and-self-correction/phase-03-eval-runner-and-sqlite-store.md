# Phase 3: Evaluation Runner & SQLite Eval Store

## Context Links
- Plan: [plan.md](./plan.md)
- Reflexion Loop: [phase-02-reflexion-self-correction-loop.md](./phase-02-reflexion-self-correction-loop.md)

## Requirements
1. **`eval-store.js`**:
   - Manages SQLite persistence for evaluation runs and cases using `node:sqlite`.
   - Table `eval_runs`: `id`, `suite_id`, `total_cases`, `passed_cases`, `pass_at_1`, `recovery_rate`, `avg_latency_ms`, `total_tokens`, `created_at`.
   - Table `eval_cases`: `id`, `run_id`, `benchmark_id`, `initial_pass`, `final_pass`, `repair_attempts`, `critique_summary`, `duration_ms`.
   - Provides methods: `recordRun()`, `recordCase()`, `getRun(id)`, `listRuns(limit)`.
2. **`eval-runner.js`**:
   - Orchestrates execution of benchmarks sequentially.
   - Enforces single-concurrency through `ConcurrencyGate` (protecting Apple Silicon Metal GPU).
   - Isolates each benchmark in a temporary workspace directory.
   - Runs test verification in `ProcessJail` with detached PGID.
   - Triggers `ReflexionLoop` upon initial test failure.
   - Records aggregated metrics to `eval-store.js`.

## Target Files
- Create `proxy/src/workflow/eval-store.js` (< 200 LOC)
- Create `proxy/src/workflow/eval-runner.js` (< 200 LOC)
- Create `proxy/tests/eval-store.test.js` (< 200 LOC)
- Create `proxy/tests/eval-runner.test.js` (< 200 LOC)
