# Gate 14 Tech Stack: Autonomous Architectural Brainstorming Engine

## Core Architectural Invariants
1. **Zero External Proxy Dependencies**: Pure Node.js runtime built-ins (`node:events`, `node:crypto`, `node:path`, `node:fs`).
2. **Strict File Size Ceiling**: < 200 LOC per file in backend `proxy/src/workflow/` and frontend `frontend/src/components/`.
3. **Dual-Key Safety Consensus**: Key 1 (Automated test pass) + Key 2 (Invariant compliance & ARI threshold).
4. **Metal GPU Single-Concurrency**: Non-blocking event-loop cooperative yielding for debate turn transitions.

## Backend Architecture (`proxy/src/workflow/`)
- `brainstorm-engine.js` (< 200 LOC): Core orchestrator managing brainstorming sessions, Socratic debate rounds, and candidate strategy evaluation.
- `debate-protocol.js` (< 200 LOC): Socratic personas (`Advocate`, `Adversary`, `Synthesizer`) generating dialectical evaluations and dialectic convergence.
- `ari-calculator.js` (< 200 LOC): Computes Architectural Risk Index $ARI = (w_1 \cdot BR) + (w_2 \cdot CC) + (w_3 \cdot IR) + (w_4 \cdot CP)$.
- `routes-brainstorm.js` (< 200 LOC): Express sub-router mounted at `/v1/factory/brainstorm/*` (`/start`, `/sessions`, `/:id`, `/dispatch-zen`).

## Frontend Architecture (`frontend/src/`)
- `BrainstormConsole.tsx` (< 200 LOC): Primary dashboard card displaying active brainstorming sessions, Socratic debate live feed, and Pareto strategy picker.
- `BrainstormDebateFeed.tsx` (< 150 LOC): Color-coded turn-by-turn debate transcript (Advocate, Adversary, Synthesizer).
- `BrainstormStrategyCards.tsx` (< 150 LOC): Comparison grid evaluating ARI scores, blast radius, complexity delta, and execution triggers.
