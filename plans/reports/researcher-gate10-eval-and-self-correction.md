---
name: gate10-eval-self-correction-research
description: Architecture for automated evaluation, benchmark suites, and self-correction loops for ZenOS.
metadata:
  type: project
---

# Gate 10: Automated Evaluation, Benchmark & Self-Correction Research

## 1. Architectural Design
- **Eval Engine**: A standardized harness that executes generated code unit tests against defined test-cases (`test-harness.js`). It captures diffs from test failures and linting logs.
- **Benchmark Runner**: A directory-based runner (`/evals/`) executing batches of micro-benchmarks (syntax, logic, refactoring). Results are aggregated via `eval-metrics.js`.
- **Reflexion (Self-Correction Loop)**: 
    1. Agent produces output. 
    2. Critic-agent analyzes failure (mock-free test output + lint stderr).
    3. Revise-agent consumes error log and original source.
    4. Loop terminates on Success or Max-Retries (3).
- **SQLite Schema**:
    - `eval_runs`: `id, benchmark_id, timestamp, pass_rate, latency_ms, token_usage`
    - `correction_history`: `id, run_id, turn_number, patch_diff, success_flag`

## 2. Apple Silicon Challenges
- **Serialization**: With single-concurrency limit (Gate 2), benchmarks must be sequential.
- **Inference Budgeting**: Token economy is critical. Multi-turn repair loops must use terse diff-based patching rather than full-file rewriting.
- **Thermals**: Long-running evaluations require staggered CPU-cooldown windows monitored via `processJail` (Gate 8).

## 3. Modular Components (< 200 LOC)
- `eval-engine.js`: Orchestrator for test execution and report generation.
- `critic-loop.js`: Analyzes failure signatures and generates critique.
- `revision-engine.js`: Applies surgical edits based on critique (uses `Edit` tool).
- `metrics-tracker.js`: SQLite interface for performance tracking.

## 4. Adoption Risk
- **Complexity**: High risk of over-engineering the correction loop. Stick to failure-log parsing (log -> agent -> fix).
- **Maturity**: Reflexion patterns are non-deterministic; high variance in fix quality.

## Recommendations
1. Rank 1: **Log-based Reflexion**. Agent parses test/lint errors directly.
2. Rank 2: **Static Analysis CI**. Integration of `eslint` for enforced compliance before agent loop.
3. Rank 3: **Synthetic Benchmark Generation**. Using LLM to generate tests *for* the benchmarks.

Status: DONE
Summary: Gate 10 architecture defined, prioritizing log-based reflexion and sequential benchmark runners to respect Apple Silicon hardware constraints.
Work context: /Users/macbook/ZenOS
Reports: /Users/macbook/ZenOS/plans/reports/
Plans: /Users/macbook/ZenOS/plans/
