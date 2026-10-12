---
title: "Gate 12: Autonomous Code Refactoring Engine, AST-Guided Modularization & Complexity Heatmaps"
description: "Zero-dependency JS/TS code complexity analyzer, AST-guided semantic module slicer, facade barrel rewiring, and Next.js RefactorConsole with Dual-Key safety gating."
status: complete
priority: P1
branch: "main"
tags: [refactor, ast, complexity, modularization, dual-key, process-jail, zero-dependencies, sse]
blockedBy: ["261010-gate11-multi-agent-swarm-orchestration"]
blocks: []
created: "2026-10-12T16:00:00.000Z"
createdBy: "ck:plan"
source: skill
---

# Gate 12: Autonomous Code Refactoring Engine & Complexity Heatmaps

## Overview
Implement an autonomous code refactoring engine in pure Node.js (0 external npm dependencies) to enforce the strict `< 200 LOC` invariant and eliminate monolith bloat. The engine analyzes AST-lite lexical structure, computes cyclomatic/cognitive branching complexity and monolith risk scores, generates semantic decomposition plans, extracts submodules with backward-compatible barrel exports (`index.js`), verifies execution via `ProcessJail` and `ConsensusGate`, and displays live telemetry in a cyber-minimalist Next.js `RefactorConsole`.

## Phases

| Phase | Name | Status |
|---|---|---|
| 1 | [complexity-engine](./phase-01-complexity-engine.md) | Complete |
| 2 | [refactor-controller](./phase-02-refactor-controller.md) | Complete |
| 3 | [factory-endpoints](./phase-03-factory-endpoints.md) | Complete |
| 4 | [refactor-console-ui](./phase-04-refactor-console-ui.md) | Complete |

## Invariants
1. **< 200 LOC per file** across all source and test modules.
2. **0 external npm dependencies** in proxy backend (pure Node.js standard libraries).
3. **Dual-Key Safety Gating**: Refactoring execution requires both deterministic test pass in `ProcessJail` and invariant audit pass.
4. **Contract Preservation**: All public exports preserved via facade barrel patterns to prevent downstream import churn.
5. **Atomic Rollback**: Automatic restoration of workspace on any test failure or syntax error.
