---
title: "Gate 13: Autonomous Git Worktree Isolation, Blast Radius Cartography & Semantic PR Stager"
description: "Zero-dependency Git worktree isolation harness, static dependency graph cartographer, quantitative blast radius calculator, and Next.js WorktreeConsole with Dual-Key PR staging."
status: complete
priority: P1
branch: "main"
tags: [git, worktree, blast-radius, dependency-cartography, pr-stager, dual-key, zero-dependencies, sse]
blockedBy: ["261012-gate12-autonomous-refactoring-engine"]
blocks: []
created: "2026-10-12T17:30:00.000Z"
createdBy: "ck:plan"
source: skill
---

# Gate 13: Autonomous Git Worktree Isolation, Blast Radius Cartography & Semantic PR Stager

## Overview
Implement an autonomous Git worktree isolation harness, static dependency graph cartographer, and automated PR staging pipeline in pure Node.js (0 external npm dependencies). The engine isolates concurrent agent and refactoring cycles in ephemeral branch worktrees, maps the complete project dependency graph with quantitative blast radius impact scoring ($BR = \text{Depth} \times \text{Coupling} + \text{ExposureMultiplier}$), enforces Dual-Key consensus gating before branch promotion to `main`, and visualizes fleet state in a Next.js `WorktreeConsole`.

## Phases

| Phase | Name | Status |
|---|---|---|
| 1 | [worktree-jail](./phase-01-worktree-jail.md) | Complete |
| 2 | [blast-radius-engine](./phase-02-blast-radius-engine.md) | Complete |
| 3 | [pr-stager-and-routes](./phase-03-pr-stager-and-routes.md) | Complete |
| 4 | [worktree-console-ui](./phase-04-worktree-console-ui.md) | Complete |

## Invariants
1. **< 200 LOC per file** across all proxy source and test modules.
2. **0 external npm dependencies** in proxy backend (pure Node.js standard libraries).
3. **Dual-Key Safety Gating**: Branch promotion or PR merge requires deterministic test pass in `ProcessJail` and invariant audit pass.
4. **Isolated Ephemeral Workspaces**: Autonomous agents never dirty the primary working tree during exploratory or refactoring cycles.
5. **Atomic Cleanup**: Automatic pruning and removal of ephemeral worktrees on task completion or abort.
