# ZenOS Architecture & Gate 11 Multi-Agent Swarm Specification

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
│  Core Protocols & Hardware Guards:                          │
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
│  Gate 8 & 9 Sandboxing & ReAct Loop:                        │
│  - process-jail.js: Detached PGID process tree isolation    │
│  - agent-supervisor.js: Heartbeat & SQLite crash recovery   │
│  - tool-harness.js: Native 5-tool developer suite           │
│  - react-agent-loop.js: Multi-turn Reason+Act engine        │
│                                                             │
│  Gate 10 Automated Evaluation & Self-Correction:            │
│  - eval-benchmarks.js: SWE micro-benchmark suite            │
│  - diagnostic-extractor.js: Context-efficient stack parsing │
│  - reflexion-loop.js: Multi-turn critique-revision repair   │
│  - eval-store.js & eval-runner.js: SQLite scoring & test    │
│  - routes-eval.js: /v1/factory/eval/* REST & SSE endpoints  │
│                                                             │
│  Gate 11 Multi-Agent Swarm & Consensus (proxy/src/workflow):│
│  - swarm-blackboard.js: SQLite artifact ledger & sessions   │
│  - swarm-roles.js: 4 personas (Architect/Coder/QA/Auditor)  │
│  - consensus-gate.js: Dual-key test & audit verification    │
│  - swarm-orchestrator.js: Turn-based state machine          │
│  - routes-swarm.js: /v1/factory/swarm/* REST & SSE          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ Local Loopback (Port 1234)
┌─────────────────────────────────────────────────────────────┐
│                     Local Inference Host                    │
│            LM Studio / Ollama (Apple Silicon Metal)         │
│      Qwen 2.5 Coder 7B/14B, DeepSeek Coder, Gemma 27B       │
└─────────────────────────────────────────────────────────────┘
```

## Gate 11 Multi-Agent Swarm Orchestration & Dual-Key Consensus

1. **`swarm-blackboard.js` (Turn-Based SQLite Blackboard)**:
   - Eliminates conversational chat explosion by storing structured artifacts (`SPEC`, `CODE_DIFF`, `TEST_OUTPUT`, `AUDIT_REPORT`) in SQLite.
   - Prevents context window exhaustion on local Apple Silicon models.
   - Enables crash recovery: interrupted swarm turns resume from the exact artifact state.

2. **`swarm-roles.js` (Specialized Role Personas)**:
   - **Architect**: Extracts formal acceptance contracts and file targets.
   - **Coder**: Implements minimal surgical diffs respecting `< 200 LOC`.
   - **QA Verifier**: Runs test assertions inside `ProcessJail`.
   - **Auditor**: Adversarial security and invariant inspection.

3. **`consensus-gate.js` (Dual-Key Consensus Engine)**:
   - Requires two independent witnesses before code acceptance:
     - **Key 1**: Deterministic unit test pass (exit 0 in `ProcessJail`).
     - **Key 2**: Adversarial auditor sign-off.
   - Triggers automated revision turns if either witness fails.

4. **`SwarmConsole.tsx` (Operator Portal)**:
   - Real-time Next.js console displaying 4-role pipeline progression, dual-key witness indicators, artifact viewer, and live SSE streaming logs.

## Gate 12 Autonomous Refactoring Engine & Complexity Heatmaps

1. **`complexity-analyzer.js` (Pure Node.js Metric Scanner)**:
   - Evaluates line breakdown (code/comment/blank), branching density, and monolith risk index without third-party dependencies.
   - Computes workspace-wide health score and highlights files approaching the 200 LOC limit.

2. **`ast-slicer.js` (Semantic Code Decomposition & Facades)**:
   - Slices cohesive function and helper blocks into focused submodules (< 100 LOC).
   - Generates backward-compatible facade barrel files re-exporting original APIs to ensure 0 import breakage.
   - Integrates with `ProcessJail` and `ConsensusGate` to provide atomic rollback upon test failure or regression.

3. **`routes-refactor.js` & `RefactorConsole.tsx`**:
   - `/v1/factory/refactor/*` REST endpoints for analysis, planning, and execution with real-time SSE broadcasts.
   - Cyber-minimalist dashboard for monitoring codebase health, inspecting AST decompositions, and triggering self-healing.

## Gate 13: Autonomous Git Worktree Isolation & Blast Radius Cartography

1. **`worktree-jail.js` (Zero-Dependency Ephemeral Isolation)**:
   - Uses native `child_process.execFileSync` to manage isolated git worktrees in `.zenos/worktrees/`.
   - Protects the primary working tree from concurrent agent dirt and mutations.
   - Automatic `.gitignore` injection and branch cleanup with orphan pruning.

2. **`blast-radius-engine.js` (Dependency Cartography & Transitive Graph Traversal)**:
   - Fast lexical parser mapping CJS `require` and ESM `import`/`export` across the repository.
   - Computes directed graph fan-in, fan-out, and BFS cascade depth with cycle detection.
   - Calculates Quantitative Blast Radius index ($BR = \text{Depth} \times 12 + \text{FanIn} \times 8 + \text{Upstream} \times 5 + \dots$) into `SAFE`, `CAUTION`, and `CRITICAL` risk tiers.

3. **`pr-stager.js` & `routes-worktree.js` (Semantic PR Stager & Dual-Key Consensus)**:
   - Generates Conventional Commits (`feat(...)`, `fix(...)`, `refactor(...)`) and file diff summaries.
   - Enforces Dual-Key consensus (Key 1: test suite pass; Key 2: LOC & invariant audit).
   - Exposes REST endpoints on `/v1/factory/worktree/*` and streams updates to `WorktreeConsole.tsx`.

## Invariants
- **0 external npm dependencies** in proxy (100% native Node.js).
- **< 200 LOC per file** across all source and test modules.
- **Metal GPU safety**: Strict single-concurrency for local inference.
- **Process Tree Cleanup**: 100% of child processes terminated on timeout or abort.
