---
name: gate14-brainstorm-console-ui
description: UI/UX research and design specifications for the Gate 14 BrainstormConsole component.
---

# Gate 14: BrainstormConsole UI/UX Research

## 1. Cyber-Minimalist Layout
- Background `#020617` (Slate 950), containers `#0f172a` (Slate 900), borders `#1e293b`.
- Typography: Monospace `font-mono` for metrics/LOC/ARI scores; sans-serif for labels.
- Layout: 12-column responsive grid matching `WorktreeConsole.tsx` and `RefactorConsole.tsx`.

## 2. Socratic Debate Real-Time Visualization
- **Advocate Turn (Green / #10b981)**: Feature velocity, decoupling potential, architecture modernization.
- **Adversary Turn (Amber/Rose / #f59e0b / #f43f5e)**: Invariant violations, blast-radius risk, cycle regressions.
- **Synthesizer Turn (Cyan / #06b6d4)**: Consensus convergence, weighted Pareto balance, final recommendation.
- SSE integration via `/v1/factory/events` and `/v1/factory/brainstorm/session/:id`.

## 3. Multi-Strategy Pareto Comparison Cards
- Candidate strategies: `SURGICAL_SLICE` (minimal risk), `MODULAR_FACADE` (balanced), `REACTIVE_EVENT` (high throughput).
- Metrics: Architectural Risk Index (ARI), Blast Radius score, Complexity delta ($\Delta$), Touch file count.
- Visual badges: `RECOMMENDED`, `HIGH_RISK`, `CONSERVATIVE`.

## 4. Execution Triggers
- **Dispatch to /zen**: Converts winning strategy into structured execution plan.
- **Spin Worktree & Cook**: Directly initializes `WorktreeJail` ephemeral branch and runs `CookRunner`.

## 5. Invariants
- Zero `:any` types in TypeScript.
- Strict `< 200 LOC` per file in frontend.

Status: DONE
Summary: UI architecture defined for Gate 14 BrainstormConsole with Socratic debate stream and Pareto strategy cards.
Concerns/Blockers: None
