# Product Development Requirements (PDR) — ZenOS Gate 11

## Project Mission
Build an audit-first, local-first personal AI workstation engineered for Apple Silicon and solo founder workflows, delivering the AI Factory engine (`/zen`, `/cook`, `/goal`), autonomous ReAct loops, evaluation suites, and multi-agent swarm orchestration.

## Target User
Solo software founders and technical architects operating on macOS (M1/M2/M3/M4 Max with 64GB+ unified memory), running local LLMs alongside Claude Code.

## Functional Requirements

### FR-1: Cognitive Planning Engine (`/zen`)
- Accept natural language problem statements and evaluate complexity (score 1-5).
- Automatically route local vs cloud inference: score <= 3 to local LM Studio, score > 3 to cloud frontier models.
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

### FR-4: Factory REST & SSE APIs (`routes-factory.js`)
- Expose `/v1/factory/zen`, `/v1/factory/cook`, `/v1/factory/goal` endpoints.
- Broadcast real-time SSE stream on `/v1/factory/events`.

### FR-5: Process Group Isolation (`ProcessJail`)
- Detached child process spawning with unique Process Group IDs (PGID).
- Recursive process tree kill escalation (`SIGTERM` followed by grace-period `SIGKILL` to `-pgid`).

### FR-6: Autonomous Agent Supervisor (`AgentSupervisor`)
- Background heartbeat daemon monitoring active agent tasks.
- Dead-man switch triggering automated kill upon 30s heartbeat lapse.
- SQLite boot reconciliation recovering dangling in-flight tasks.

### FR-7: Autonomous ReAct Agent Loop & Local Tool Harness (`ReactAgentLoop` & `ToolHarness`)
- Zero-dependency local developer tool harness providing `read_file`, `write_file`, `edit_file`, `list_files`, and `execute_command`.
- Workspace isolation via `PathGuard` and sandboxed execution via `ProcessJail`.

### FR-8: Automated Evaluation & Self-Correction Feedback Loops (`EvalRunner` & `ReflexionLoop`)
- Deterministic SWE micro-benchmarks with isolated test workspaces (`EvalBenchmarkSuite`).
- Diagnostic mini-stack extractor isolating failure lines and 4-line context (`DiagnosticExtractor`).
- Multi-turn Reflexion (Critique-Revision) self-repair loop applying surgical patches.
- Durable relational SQLite scoring (`EvalStore` storing `eval_runs` and `eval_cases`).

### FR-9: Multi-Agent Swarm Orchestration & Dual-Key Consensus (`SwarmOrchestrator` & `ConsensusGate`)
- Turn-Based Blackboard State Machine in SQLite (`SwarmBlackboard`) managing atomic artifact handoffs.
- Hierarchical 4-Role specialization: Architect, Coder, Auditor, QA Verifier (`SwarmRoles`).
- Dual-Key Consensus Gating (`ConsensusGate`): Code merge requires both deterministic test pass (Key 1) and adversarial auditor approval (Key 2).
- Metal GPU single-concurrency serialization avoiding unified memory context thrashing.
- Real-time Next.js operator portal displaying role pipeline and dual-key locks (`SwarmConsole`).

### FR-10: Autonomous Code Refactoring Engine & Complexity Heatmaps (`ComplexityAnalyzer` & `AstSlicer`)
- Zero-dependency lexical and AST-lite code analysis calculating LOC breakdown and branching complexity.
- Monolith risk scoring formula ranking candidate files for proactive modularization.
- Automated semantic slicing decomposing large files into cohesive submodules (< 100 LOC).
- Backward-compatible facade barrel exports (`index.js`) preserving existing consumer import paths.
- TDD-verified atomic execution with instant rollback on test failure or LOC violation.
- Next.js RefactorConsole dashboard with health gauges, heatmaps, and live SSE streaming logs.

### FR-11: Deep Code-Introspective Brainstorming & Hotspot Auto-Refactor Pipeline (`DeepCodeInspector` & `/brainstorming --deep`)
- Live workspace AST/lexical seam extraction and dependency blast radius calculations via `DeepCodeInspector`.
- 5-turn Socratic Cross-Examination pipeline (`ADVOCATE` $\rightarrow$ `ADVERSARY` $\rightarrow$ `CROSS_EXAMINER` $\rightarrow$ `REBUTTAL` $\rightarrow$ `SYNTHESIZER`).
- Automated workspace hotspot scanning and batch brainstorming (`POST /v1/factory/brainstorm/auto-hotspots`).
- Proactive monolith slicing of core UI and proxy modules strictly adhering to `< 200 LOC`.
- Modular Next.js `BrainstormConsole` and `BrainstormStrategyPanel` featuring live telemetry, `--deep` toggles, and submodule split blueprint previews.
- Verified test suite with 243/243 passing tests across 30 suites.

## Non-Functional Requirements
- Zero external proxy dependencies (pure native Node.js).
- 100% green test pass rate.
- < 200 LOC per file across all source and test modules.
- Sub-10ms proxy overhead for routing and checkpointing.
