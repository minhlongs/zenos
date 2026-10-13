# ZenOS System Architecture

ZenOS is an autonomous personal AI workstation and TDD orchestration platform optimized for Apple Silicon (M-series) Macs with native Metal GPU acceleration.

## Core Architectural Invariants
- **0 external npm dependencies in proxy backend**: Exclusively native Node.js standard libraries (`node:http`, `node:sqlite`, `node:crypto`, `node:fs`, `node:path`, `node:events`, `node:child_process`).
- **< 200 LOC per file ceiling**: Every file in `proxy/src/`, `proxy/tests/`, and `frontend/src/` strictly enforces `< 200 LOC`.
- **Zero `:any` types in frontend**: TypeScript contracts strictly validated.
- **Apple Silicon Metal Protection**: Local LLM calls gated to single-concurrency to prevent GPU thermal throttling.

---

## Gate 13: Autonomous Git Worktree Isolation & Blast Radius Cartography
1. **`worktree-jail.js`**: Ephemeral Git worktree isolation in `.zenos/worktrees/` via native `child_process.execFileSync`.
2. **`blast-radius-engine.js`**: Lexical dependency cartography and transitive BFS cascade depth scoring ($BR = \text{Depth} \times 12 + \text{FanIn} \times 8 + \dots$).
3. **`pr-stager.js` & `WorktreeConsole.tsx`**: Conventional Commit staging, Dual-Key consensus gating, and real-time operations console.

---

## Gate 14: Autonomous Architectural Brainstorming & Socratic Gating Engine (`/brainstorming --deep`)
1. **`ari-calculator.js` (Architectural Risk Index & Pareto Ranker)**:
   - Quantitative evaluation matrix combining Blast Radius ($BR$), Cyclomatic Complexity ($CC$), Invariant Risk ($IR$), and Churn Probability ($CP$):
     $$ARI = (0.35 \cdot BR) + (0.25 \cdot CC) + (0.25 \cdot IR) + (0.15 \cdot CP)$$
   - Categorizes refactoring strategies into `SAFE` ($< 30$), `CAUTION` ($30 \le ARI < 60$), and `CRITICAL` ($\ge 60$).
2. **`debate-protocol.js` & `brainstorm-engine.js` (Socratic Dialectic Protocol)**:
   - Multi-agent dialectic debate cycle:
     - **Advocate**: Velocity champion proposing modular decomposition and decoupling.
     - **Adversary**: Safety inquisitor attacking blast radius escalations and invariant breaks.
     - **Synthesizer**: Arbitrator reconciling arguments and outputting Pareto-optimal candidates.
   - Non-blocking cooperative turn execution with Metal GPU awareness.
   - `dispatchToZen`: Converts chosen Pareto candidate into an actionable `/zen` plan.
3. **`routes-brainstorm.js` & `BrainstormConsole.tsx`**:
   - Mounted at `/v1/factory/brainstorm/*` (`/start`, `/sessions`, `/session/:id`, `/dispatch-zen`).
   - Cyber-minimalist dark slate Next.js dashboard featuring live turn-by-turn debate transcript, Pareto strategy cards, and one-click `/zen` dispatch.
