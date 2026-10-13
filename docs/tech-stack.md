# ZenOS Tech Stack & Architectural Decisions (Gate 11)

## Core Technologies

### 1. Proxy Backend Runtime
- **Runtime**: Node.js >= 18.0.0 (Native CommonJS / ESM).
- **Zero-Dependency Core**: Exclusively native built-in modules (`node:http`, `node:sqlite`, `node:crypto`, `node:fs`, `node:events`, `node:child_process`, `node:net`).
- **HTTP Routing & Security**: Lightweight Express 4.x + Helmet + CORS bound to loopback `127.0.0.1`.
- **Concurrency & Metal GPU Safety**: In-process `ConcurrencyGate` enforcing strict single-concurrency for Apple Silicon Metal inference.

### 2. Multi-Agent Swarm Orchestration (Gate 11)
- **Turn-Based Blackboard**: Shared transactional ledger in SQLite (`swarm_sessions`, `swarm_artifacts`, `swarm_consensus`).
- **Hierarchical Role Delegation**: 4 specialized personas (Architect, Coder, Auditor, QA Verifier).
- **Dual-Key Consensus**: Two-witness gating requiring automated test suite pass (Key 1) and adversarial auditor sign-off (Key 2).
- **Context Preservation**: Atomic artifact handoffs (specs, diffs, reports) preventing quadratic conversation bloat.

### 3. Automated Evaluation & Reflexion (Gate 10)
- **SWE Micro-Benchmarks**: Self-contained edge cases (`bug_sort_null`, `bug_off_by_one`, etc.).
- **Diagnostic Extractor**: Token-efficient error stack localization with 4-line context radius.
- **Reflexion Loop**: Multi-turn critique-revision self-repair loop with SQLite metric tracking (`eval_runs`, `eval_cases`).

### 4. Autonomous Code Refactoring & Complexity Engine (Gate 12)
- **Complexity Analyzer**: Pure Node.js lexical metric engine calculating LOC, branching density, and monolith risk ratings.
- **AST Slicer & Facade Generator**: Regex/AST-lite code extractor decomposing monoliths into focused submodules (< 100 LOC) and wiring backward-compatible barrel exports.
- **TDD Safety & Rollback**: Automatic pre-refactor snapshotting, ProcessJail test verification, and instantaneous rollback on regressions.
- **RefactorConsole**: Cyber-minimalist dashboard for workspace health, monolith hotlists, and live SSE operations.

### 5. Git Worktree Isolation, Blast Radius & PR Staging (Gate 13)
- **Worktree Jail (`WorktreeJail`)**: Zero-dependency `git worktree` isolation harness spawning ephemeral branch worktrees at `.zenos/worktrees/<id>` or `/tmp/zenos-worktrees/<id>`.
- **Blast Radius Cartography (`BlastRadiusEngine`)**: Zero-dependency lexical dependency graph mapper computing upstream fan-in, downstream fan-out, transitive cascade depth, cycle detection, and quantitative risk scores ($BR = \text{Depth} \times \text{Coupling} + \text{ExposureMultiplier}$).
- **Automated PR Stager (`PrStager`)**: Conventional Commit authoring, automated branch preparation, diff summarization, and Dual-Key consensus gating for promotion to `main`.
- **Worktree Console (`WorktreeConsole`)**: Real-time Next.js console displaying active ephemeral worktrees, visual blast radius cascade maps, and one-click PR staging.

### 6. Process Sandboxing & Isolation (Gate 8 & 9)
- **Process Jail**: Spawns detached PGID process trees with recursive kill escalation (`SIGTERM`/`SIGKILL`).
- **Agent Supervisor**: 5s SQLite heartbeat daemon with boot-time crash reconciliation.
- **Autonomous Tool Harness**: Native 5-tool developer suite (`read_file`, `write_file`, `edit_file`, `list_files`, `execute_command`).

### 5. Frontend Operator Portal
- **Framework**: Next.js 14 (App Router), TypeScript 5.x (Strict mode, zero `:any`).
- **Styling**: Cyber-minimalist dark theme with Tailwind CSS 3.x and Lucide React.
- **Streaming**: Native Server-Sent Events (SSE) on `/v1/factory/events`.

### 6. Local Inference Engine
- **Host**: LM Studio / Ollama bound to `http://localhost:1234`.
- **Models**: Qwen 2.5 Coder 14B / DeepSeek Coder 14B on Apple Silicon Metal GPU.

### 7. Invariants & Governance
- **File Length**: Strictly < 200 LOC per file across all source and test modules.
- **Zero External Backend Dependencies**: 100% native Node.js core.
- **Zero TypeScript `:any`**: Verified via `npm run build`.
