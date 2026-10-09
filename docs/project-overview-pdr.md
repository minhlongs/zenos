# Product Development Requirements (PDR) — ZenOS Gate 6

## Project Mission
Build an audit-first, local-first personal AI workstation engineered for Apple Silicon and solo founder workflows, delivering the AI Factory engine (`/zen`, `/cook`, `/goal`).

## Target User
Solo software founders and technical architects operating on macOS (M1/M2/M3/M4 Max with 64GB+ unified memory), running local LLMs alongside Claude Code.

## Functional Requirements

### FR-1: Cognitive Planning Engine (`/zen`)
- Accept natural language problem statements and evaluate complexity (score 1-5).
- Automatically route local vs cloud inference: score <= 3 to local LM Studio (e.g. Qwen 2.5 Coder 14B), score > 3 to cloud frontier models.
- Decompose requests into structured JSON plan specs with explicit test assertions and file mutation targets.

### FR-2: Deterministic TDD Execution Runner (`/cook`)
- Run iterative Red-Green-Refactor development cycles via `node:child_process`.
- Automatically invoke tests using `node --test` or workspace runners.
- Circuit breaker: halt after 5 consecutive failures and alert operator.
- Rollback: discard breaking changes on severe regression.
- Validate that all touched files adhere strictly to `< 200 LOC`.

### FR-3: Durable Milestone Manager (`/goal`)
- Provide long-running goal execution across multi-phase plans.
- Store transactional checkpoints in SQLite (`task_checkpoints`).
- Support pause, resume, and abort without context loss across workstation restarts.
- Integrate with Gate 4 `ApprovalGate` when high-risk commands are detected.

### FR-4: Factory REST & SSE APIs (`routes-factory.js`)
- Expose `/v1/factory/zen`, `/v1/factory/cook`, `/v1/factory/goal` endpoints.
- Broadcast real-time SSE stream on `/v1/factory/events`.

### FR-5: Thin CLI Dispatchers
- Provide `bin/zen`, `bin/cook`, `bin/goal` executable dispatchers (< 60 LOC each).

### FR-6: Process Group Isolation (`ProcessJail`)
- Detached child process spawning with unique Process Group IDs (PGID).
- Recursive process tree kill escalation (`SIGTERM` followed by grace-period `SIGKILL` to `-pgid`).
- Elimination of zombie/orphaned processes on Apple Silicon.

### FR-7: Autonomous Agent Supervisor & Crash Recovery (`AgentSupervisor`)
- Background heartbeat daemon monitoring active agent tasks.
- Dead-man switch triggering automated kill and failure state transition upon 30s heartbeat lapse.
- SQLite boot reconciliation recovering dangling in-flight tasks and cleaning orphaned process trees.
- Emergency `kill-all` control endpoint and dark-mode Supervisor UI monitor.

### FR-8: Autonomous ReAct Agent Loop & Local Tool Harness (`ReactAgentLoop` & `ToolHarness`)
- Zero-dependency local developer tool harness providing `read_file`, `write_file`, `edit_file`, `list_files`, and `execute_command`.
- Workspace isolation via `PathGuard` and sandboxed command execution via `ProcessJail` and `CommandGuard`.
- Autonomous multi-turn Reason+Act execution with XML `<tool_call>` parsing.
- Metal GPU single-concurrency serialization via `ConcurrencyGate`.
- Step-by-step state checkpointing into SQLite `TaskStore` with context compactor window sliding.
- Live SSE telemetry streaming to the frontend `AgentConsole`.

### FR-9: Automated Evaluation & Self-Correction Feedback Loops (`EvalRunner` & `ReflexionLoop`)
- Deterministic SWE micro-benchmarks with isolated test workspaces (`EvalBenchmarkSuite`).
- Context-efficient mini-stack extractor isolating failure lines and 4-line code context (`DiagnosticExtractor`).
- Multi-turn Reflexion (Critique-Revision) self-repair loop applying surgical patches upon test failures.
- Durable relational SQLite scoring (`EvalStore` storing `eval_runs` and `eval_cases` for Pass@1, recovery rate, and latency metrics).
- Subprocess environment isolation clearing `NODE_TEST_CONTEXT` in `ProcessJail`.
- Live Next.js operator console with real-time Pass@1, recovery rate metrics, and streaming case diagnostics (`EvalConsole`).

## Non-Functional Requirements
- Zero external proxy dependencies.
- 100% green test pass rate.
- Sub-10ms proxy overhead for routing and checkpointing.
