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

## Invariants
- **0 external npm dependencies** in proxy (100% native Node.js).
- **< 200 LOC per file** across all source and test modules.
- **Metal GPU safety**: Strict single-concurrency for local inference.
- **Process Tree Cleanup**: 100% of child processes terminated on timeout or abort.
