---
title: "Gate 11: Multi-Agent Swarm Orchestration, Hierarchical Role Delegation & Dual-Key Consensus"
description: "Turn-based Blackboard state machine, 4 specialized agent roles (Architect, Coder, Auditor, QA), SQLite consensus store, and Next.js SwarmConsole."
status: planned
priority: P1
branch: "main"
tags: [swarm, multi-agent, blackboard, consensus, dual-key, sqlite, apple-silicon, sse]
blockedBy: ["261010-gate10-automated-eval-and-self-correction"]
blocks: []
created: "2026-10-10T02:00:00.000Z"
createdBy: "ck:plan"
source: skill
---

# Gate 11: Multi-Agent Swarm Orchestration, Hierarchical Role Delegation & Dual-Key Consensus

## Overview
Implement an Apple Silicon-optimized multi-agent swarm engine using a Turn-Based Blackboard State Machine in SQLite (`node:sqlite`). Coordinate 4 specialized personas (Architect, Coder, Auditor, QA Verifier) via atomic artifact handoffs, enforce Dual-Key Consensus (automated test pass + adversarial auditor sign-off) before merge, and deliver real-time SSE observability to a cyber-minimalist Next.js `SwarmConsole`.

## Phases

| Phase | Name | Status |
|---|---|---|
| 1 | [swarm-blackboard-and-consensus-gate](./phase-01-swarm-blackboard-and-consensus-gate.md) | Planned |
| 2 | [swarm-roles-and-orchestrator](./phase-02-swarm-roles-and-orchestrator.md) | Planned |
| 3 | [routes-and-frontend-swarm-console](./phase-03-routes-and-frontend-swarm-console.md) | Planned |
| 4 | [verification-and-loc-guard](./phase-04-verification-and-loc-guard.md) | Planned |

## Invariants
1. **< 200 LOC per file** across all source and test modules.
2. **0 external npm dependencies** in proxy backend (pure Node.js).
3. **Metal GPU Single-Concurrency**: Sequential role execution honoring `ConcurrencyGate` (limit = 1).
4. **Sandboxed Test Execution**: QA Verifier tests run via `ProcessJail` with detached PGID.
5. **Durable Persistence**: Sessions, turns, and consensus keys recorded in SQLite `task_store`.
