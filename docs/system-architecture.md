# ZenOS Architecture & Gate 8 Process Isolation & Supervisor Specification

## High-Level System Architecture

ZenOS is an audit-first, local-first personal AI workstation engineered for Apple Silicon (M1-M4 Max) and solo founder workflows.

```
┌─────────────────────────────────────────────────────────────┐
│                 Client & Control Interfaces                 │
│  Claude Code CLI  │  Thin CLI (zen, cook, goal)  │  Web UI  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ HTTP / SSE (Port 20129)
┌─────────────────────────────────────────────────────────────┐
│                    ZenOS Workstation Proxy                  │
│                                                             │
│  Core Protocols:                                            │
│  - routes-anthropic.js: Messages API translation & SSE      │
│  - model-router.js & failover.js: Alias & upstream fallback │
│  - concurrency-gate.js: Metal GPU admission (limit = 1)     │
│                                                             │
│  Gate 3 & 4 Security & Durability:                          │
│  - task-store.js: SQLite task state & checkpoints           │
│  - markdown-memory.js: Atomic episodic memory notes         │
│  - path-guard.js & command-guard.js: Workspace jail         │
│  - approval-gate.js: Human approval queue for high-risk     │
│                                                             │
│  Gate 5 Observability & Gate 7 Factory Portal:              │
│  - telemetry.js: In-memory metrics & SSE streaming          │
│  - dashboard-html.js: Zero-dependency embedded Web UI       │
│  - tool-parser.js & context-compactor.js: Local harnesses   │
│                                                             │
│  Gate 6 Factory Automation Engine (proxy/src/workflow/):    │
│  - zen-director.js: Cognitive architecture & planning       │
│  - cook-runner.js: Deterministic TDD (red-green-refactor)   │
│  - goal-manager.js: Durable milestones with pause/resume    │
│  - loc-guard.js: Enforces < 200 LOC per file invariant      │
│  - factory-engine.js: Pipeline coordinator                  │
│  - routes-factory.js: REST & SSE endpoints                  │
│                                                             │
│  Gate 8 Sandboxing & Supervisor (proxy/src/workflow/):      │
│  - process-jail.js: Detached PGID process tree isolation    │
│  - agent-supervisor.js: Heartbeat & SQLite crash recovery   │
│                                                             │
│  Gate 9 Autonomous ReAct Loop (proxy/src/workflow/):        │
│  - tool-harness.js: Native 5-tool developer suite           │
│  - react-agent-loop.js: Multi-turn Reason+Act engine        │
│                                                             │
│  Gate 10 Automated Evaluation & Self-Correction:            │
│  - eval-benchmarks.js: SWE micro-benchmark suite            │
│  - diagnostic-extractor.js: Context-efficient stack parsing │
│  - reflexion-loop.js: Multi-turn critique-revision repair   │
│  - eval-store.js: SQLite eval_runs & eval_cases persistence │
│  - eval-runner.js: Orchestrates isolated test execution     │
│  - routes-eval.js: /v1/factory/eval/* REST & SSE endpoints  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ Local Loopback (Port 1234)
┌─────────────────────────────────────────────────────────────┐
│                     Local Inference Host                    │
│            LM Studio / Ollama (Apple Silicon Metal)         │
│      Qwen 2.5 Coder 7B/14B, DeepSeek Coder, Gemma 27B       │
└─────────────────────────────────────────────────────────────┘
```

## Gate 8 Sandboxing & Supervisor Architecture

1. **`process-jail.js` (Detached Process Tree Jail)**:
   - Spawns tasks in distinct Process Groups (`detached: true`).
   - Recursively cleans child process trees using `process.kill(-pgid, 'SIGTERM'/'SIGKILL')`.
   - Protects Apple Silicon cores and RAM from runaway sub-processes or stuck build daemons.
   - Enforces configurable CPU execution time limits (dead-man timer).

2. **`agent-supervisor.js` (Crash Recovery & Heartbeat Daemon)**:
   - Maintains periodic heartbeat timestamps in SQLite `task_checkpoints`.
   - On proxy startup, performs recovery reconciliation: detects tasks orphaned in `COOKING` or `PLANNING` states.
   - Automatically marks orphaned tasks as `INTERRUPTED` or transitions them to resume queues.
   - Dispatches supervisor events via SSE to the Factory Dashboard.

## Gate 10 Automated Evaluation & Reflexion Self-Correction Architecture

1. **`diagnostic-extractor.js` (Mini-Stack Sanitization)**:
   - Filters extraneous Node.js internal runtime and `node_modules` frames.
   - Extracts exact assertion failure messages, failure file, and 1-indexed line number.
   - Captures surgical 4-line source code context radius without blowing prompt context on local Apple Silicon models.

2. **`eval-benchmarks.js` (Deterministic SWE Micro-Benchmarks)**:
   - Self-contained, realistic bug repair tasks (`bug_sort_null`, `bug_off_by_one`, `bug_regex_escape`, `bug_async_race`).
   - Isolated temporary workspaces initialized with mock test runners and reproducible setup files.

3. **`reflexion-loop.js` (Multi-Turn Critique-Revision)**:
   - Analyzes test verifier failure diagnostics and prompts LLM with diagnostic mini-stacks.
   - Applies targeted code patches and re-runs test suite iteratively.
   - Tracks retry attempts, critique history, and error transitions.

4. **`eval-store.js` & `eval-runner.js` (Persistence & Execution)**:
   - SQLite tables `eval_runs` and `eval_cases` compute Pass@1, recovery rate, duration, and error traces.
   - Test execution isolated inside `ProcessJail` with environment sanitization (`delete env.NODE_TEST_CONTEXT`).

5. **`EvalConsole.tsx` (Operator Portal)**:
   - Real-time Next.js console displaying Pass@1, Reflexion recovery rate, case breakdowns, and live SSE streaming logs.

## Invariants
- **0 external npm dependencies** in proxy (100% native Node.js).
- **< 200 LOC per file** across all source and test modules.
- **Metal GPU safety**: Strict single-concurrency for local inference.
- **Process Tree Cleanup**: 100% of child processes terminated on timeout or abort.
- **Subprocess Test Isolation**: Child test processes cleanly isolated from parent test harnesses.
