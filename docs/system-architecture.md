# ZenOS Architecture & Gate 6 AI Factory Specification

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
│  Gate 5 Observability:                                      │
│  - telemetry.js: In-memory metrics & SSE streaming          │
│  - dashboard-html.js: Zero-dependency embedded Web UI       │
│                                                             │
│  Gate 6 Factory Automation Engine (proxy/src/workflow/):    │
│  - zen-director.js: Cognitive architecture & planning       │
│  - cook-runner.js: Deterministic TDD (red-green-refactor)   │
│  - goal-manager.js: Durable milestones with pause/resume    │
│  - loc-guard.js: Enforces < 200 LOC per file invariant      │
│  - factory-engine.js: Pipeline coordinator                  │
│  - routes-factory.js: REST & SSE endpoints                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ Local Loopback (Port 1234)
┌─────────────────────────────────────────────────────────────┐
│                     Local Inference Host                    │
│            LM Studio / Ollama (Apple Silicon Metal)         │
│      Qwen 2.5 Coder 7B/14B, DeepSeek Coder, Gemma 27B       │
└─────────────────────────────────────────────────────────────┘
```

## Gate 6 AI Factory Tri-Service Design

1. **`/zen` (Cognitive Director)**:
   - Evaluates complexity score (1-5).
   - Routes between local models (score <= 3) and cloud frontier models (score > 3).
   - Generates structured execution plans and TDD test assertions.

2. **`/cook` (Deterministic TDD Runner)**:
   - Executes Red -> Green -> Refactor cycle via `node:child_process`.
   - Enforces 5-iteration circuit breaker and git rollback on regressions.
   - Enforces strict `< 200 LOC` invariant before accepting changes.

3. **`/goal` (Durable Milestone Manager)**:
   - Manages state machine: `IDLE` -> `PLANNING` -> `COOKING` -> `VERIFYING` -> `PAUSED` -> `COMPLETED`.
   - Persists state checkpoints to SQLite (`task_checkpoints`).
   - Supports seamless pause/resume and Gate 4 human approval interlocks.

## Invariants
- **0 external npm dependencies** in proxy (100% native Node.js).
- **< 200 LOC per file** across all source and test modules.
- **Metal GPU safety**: Strict single-concurrency for local inference.
