# Strategic Brainstorming Report: Gate 10 — Automated Evaluation, Benchmark Suites & Self-Correction Feedback Loops

**Date**: 2026-10-10  
**Status**: APPROVED / READY FOR ARCHITECTURAL SPECIFICATION & PLANNING  
**Authors**: ZenOS Architecture Core (Antigravity & Claude Fable 5)  
**Domain**: Autonomous Model Evaluation, Deterministic Benchmarks & Reflexive Self-Correction  

---

## 1. Executive Summary & Problem Statement

ZenOS has established the foundational workstation substrate across Gates 1 through 9:
- **Gate 1-2**: Model routing, Apple Silicon Metal GPU concurrency gating (limit = 1), and upstream failover.
- **Gate 3-5**: SQLite durability (`node:sqlite`), process sandboxing (`PathGuard`, `CommandGuard`, `ApprovalGate`), and observability.
- **Gate 6-7**: AI factory workflows (`/zen`, `/cook`, `/goal`), visual web portals, and local harnesses.
- **Gate 8-9**: Detached process group sandboxing (`ProcessJail`), crash recovery supervisor (`AgentSupervisor`), and autonomous multi-turn ReAct loops (`ReactAgentLoop`, `ToolHarness`).

While the workstation can now execute autonomous agent loops with native developer tools, **autonomous code generation by local open models (e.g. Qwen 2.5 Coder 14B) suffers from non-deterministic logic flaws, syntax regressions, and hallucinated interfaces.**

Without automated evaluation and self-correction:
1. Operators cannot benchmark or compare model accuracy across model upgrades or parameter changes.
2. Initial generation errors immediately fail builds without giving the agent an opportunity to self-heal.
3. Unconstrained retry loops explode model context windows on Apple Silicon unified memory.

**Gate 10 delivers the Automated Evaluation, Benchmark Suite & Self-Correction Engine**:
A deterministic evaluation runner, a standardized SWE micro-benchmark suite, an automated **Reflexion (Critique-Revision) loop** with localized stack extraction, and SQLite-backed scoring metrics (Pass@1, Pass@k, Recovery Rate).

---

## 2. Core Architectural Pillars

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Gate 10 Automated Evaluation Engine                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│  Benchmark   │             │  Eval Engine │             │  Reflexion   │
│    Suite     │             │  & Runner    │             │ Self-Repair  │
│              │             │              │             │    Loop      │
│ 5-10 SWE     │             │ Sequential   │             │ Mini-Stack   │
│ Deterministic│             │ Metal Queue  │             │ Extraction & │
│ Micro-cases  │             │ Execution    │             │ Targeted Fix │
└──────┬───────┘             └──────┬───────┘             └──────┬───────┘
       │                            │                            │
       └────────────────────────────┼────────────────────────────┘
                                    ▼
                     ┌──────────────────────────────┐
                     │  Metrics & SQLite Persistence│
                     │  - Pass@1 / Pass@k           │
                     │  - Recovery Rate             │
                     │  - eval_runs / eval_cases    │
                     └──────────────┬───────────────┘
                                    ▼
                     ┌──────────────────────────────┐
                     │ REST API & SSE / Frontend UI │
                     │  /v1/factory/eval/*          │
                     │  EvalConsole.tsx (Zero :any) │
                     └──────────────────────────────┘
```

### Pillar A: Deterministic SWE Micro-Benchmark Suite (`eval-benchmarks.js`)
A suite of 5-10 self-contained, deterministic software engineering micro-benchmarks that test real capabilities without external network dependencies:
1. **Algorithmic Edge Case (`bug_sort_null`)**: Fix unstable comparator and null/undefined handling in numeric sorting.
2. **Schema & API Handler (`api_request_validator`)**: Implement request validator returning HTTP 400 with structured validation errors vs 200.
3. **LOC & Cyclomatic Refactor (`refactor_loc_guard`)**: Refactor nested conditionals and bloated functions into modular helpers adhering to `< 200 LOC`.
4. **Unit Test Generation (`test_generator_crud`)**: Generate missing unit tests with 100% branch coverage for a CRUD state machine.
5. **JSON Data Transformation (`json_transform_stream`)**: Convert nested object structures into flat normalized key-value records.

Each benchmark defines:
- `id`, `title`, `description`, `category` (bugfix, refactor, testgen, api).
- `setupFiles`: Initial workspace files with deliberate bugs or incomplete stubs.
- `evalCriteria`: Expected unit tests (`node --test`), syntax check, and LOC limit verification.
- `timeoutMs`: Fast execution limit (< 30 seconds).

### Pillar B: Sequential Evaluation Runner (`eval-runner.js`)
- Enforces strict Apple Silicon Metal GPU safety by serializing benchmark runs through `ConcurrencyGate`.
- Executes tests in `ProcessJail` to guarantee zero zombie processes or resource leaks.
- Supports running individual benchmarks or full suites with configurable iteration limits (`maxRounds`, `timeoutMs`).

### Pillar C: Reflexion & Self-Correction Feedback Loop (`reflexion-loop.js`)
When an initial generation or benchmark fails:
1. **Mini-Stack & Diagnostic Extractor (`diagnostic-extractor.js`)**:
   - Parses `stderr`, test failure assertions, and syntax/LOC errors.
   - Extracts the top 3-5 lines of stack trace plus 5 lines surrounding the fault line in source files.
   - Strips noisy dependency traces to avoid context explosion on local LLMs.
2. **Critique Generation**:
   - Compiles a focused critique payload: `{ failureReason, faultLocation, failedAssertion, surroundingLines }`.
   - Prompts the model: *"Identify the root cause in one sentence and propose the minimal surgical fix."*
3. **Revision Execution**:
   - Feeds the critique back into the `ReactAgentLoop` or surgical editor.
   - Iterates up to `maxRetries` (default: 3) until all test assertions pass.

### Pillar D: Durability, Scoring & SQLite Schema (`eval-store.js`)
Stores run results transactionally in SQLite `task_store`:
- `eval_runs`:
  - `id`: Unique run ID (`eval_timestamp`).
  - `suite_id`: Suite name or benchmark ID.
  - `total_cases`, `passed_cases`, `pass_at_1`, `recovery_rate`.
  - `avg_latency_ms`, `total_tokens`.
  - `created_at`: ISO timestamp.
- `eval_cases`:
  - `id`: Case execution ID.
  - `run_id`: Foreign key to `eval_runs`.
  - `benchmark_id`: Benchmark identifier.
  - `initial_pass`: Boolean (1 = passed on turn 1, 0 = failed).
  - `final_pass`: Boolean.
  - `repair_attempts`: Number of self-correction attempts (0-3).
  - `critique_summary`: Condensed summary of critique if self-corrected.
  - `duration_ms`: Execution time.

### Pillar E: REST Endpoints, SSE Streaming & Frontend Console (`EvalConsole.tsx`)
1. **Factory Endpoints (`proxy/src/workflow/routes-factory.js`)**:
   - `GET /v1/factory/eval/benchmarks`: List available benchmark test cases.
   - `POST /v1/factory/eval/run`: Trigger evaluation run (single or suite).
   - `GET /v1/factory/eval/runs`: List historical evaluation runs and metrics.
   - `GET /v1/factory/eval/runs/:id`: Fetch detailed case breakdown and critique logs.
   - Real-time SSE events over `/v1/factory/events`: `eval_start`, `eval_case_start`, `eval_case_critique`, `eval_case_repair`, `eval_case_complete`, `eval_summary`.
2. **Operator Frontend Component (`frontend/src/components/EvalConsole.tsx`)**:
   - Benchmark launcher with single/suite selection.
   - Pass@1 and Self-Repair recovery rate gauges.
   - Live stream card showing diagnostic stack traces, critique notes, and revision diffs.
   - Integrated into `frontend/src/app/page.tsx`. Zero `:any` TypeScript types.

---

## 3. Strict Invariants

1. **Zero External Dependencies**: Pure Node.js standard libraries (`node:fs`, `node:path`, `node:child_process`, `node:sqlite`, `node:events`).
2. **File Size Invariant**: Strictly `< 200 LOC` per file across all new source and test files.
3. **Apple Silicon Metal Safety**: All benchmark model calls routed through `ConcurrencyGate` (concurrency limit = 1).
4. **Sandboxed Test Runs**: All benchmark test scripts executed via `ProcessJail` with detached PGID and strict timeouts.
5. **100% Green Test Suite**: Full test coverage across all new modules without regression.

---

## 4. Architectural Component Breakdown (< 200 LOC Each)

To adhere strictly to `< 200 LOC`:
1. `proxy/src/workflow/eval-benchmarks.js`: Benchmark suite definitions and validation rules (~150 LOC).
2. `proxy/src/workflow/diagnostic-extractor.js`: Error log, stack trace, and fault line extractor (~110 LOC).
3. `proxy/src/workflow/reflexion-loop.js`: Self-correction critique-revision loop coordinator (~160 LOC).
4. `proxy/src/workflow/eval-runner.js`: Benchmark test execution runner with ConcurrencyGate integration (~160 LOC).
5. `proxy/src/workflow/eval-store.js`: SQLite schema migration and transactional scoring storage (~130 LOC).
6. `proxy/src/workflow/routes-factory.js`: Updated REST & SSE endpoints (~190 LOC).
7. `frontend/src/components/EvalConsole.tsx`: Next.js 14 cyber-minimalist evaluation interface (~170 LOC).

---

## 5. Strategic Verdict

**APPROVED**. Proceed immediately to formal planning (`/ck:plan --parallel`) for Gate 10, delivering the automated evaluation suite, reflexive self-correction loop, and SQLite metrics storage.
