---
title: "Gate 6: AI Factory Workflows (/zen, /cook, /goal) Integration"
description: "Implementation of the tri-service AI Factory workflow engine in proxy/src/workflow/ with Apple Silicon Metal protection, SQLite checkpointing, and deterministic TDD."
status: completed
priority: P1
branch: "main"
tags: [workflow, zen, cook, goal, tdd, sqlite, metal-gpu, ai-factory]
blockedBy: ["261009-gate5-operational-dashboard-observability"]
blocks: []
created: "2026-10-09T20:10:00.000Z"
createdBy: "ck:plan"
source: skill
---

# Gate 6: AI Factory Workflows (/zen, /cook, /goal) Integration

## Overview

Build the audit-first, local-first AI Factory workflow automation engine inside `proxy/src/workflow/`:
1. **Foundation & Invariant Enforcer (`loc-guard.js`, `task_checkpoints` migration)**: Strict static code limit inspection (<200 LOC per file) and SQLite checkpoint durability.
2. **Cognitive Planning Engine (`zen-director.js`)**: Task complexity scoring (1-5), local (Apple Silicon) vs cloud frontier routing, and structured TDD specification generator.
3. **Deterministic TDD Execution Runner (`cook-runner.js`)**: Red-Green-Refactor loop runner with 5-iteration circuit breaker, git rollback interlock, and LOC verification.
4. **Durable Milestone Manager (`goal-manager.js`)**: Lifecycle state machine (`IDLE` -> `PLANNING` -> `COOKING` -> `VERIFYING` -> `PAUSED` -> `COMPLETED`), SQLite checkpoint restoration, and Gate 4 approval checks.
5. **Master Orchestrator, REST/SSE Routes & CLI (`factory-engine.js`, `routes-factory.js`, `cli/bin/*`)**: Unified pipeline coordination, HTTP/SSE streaming, and thin CLI dispatchers.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [workflow-foundation-and-loc-guard](./phase-01-workflow-foundation-and-loc-guard.md) | Completed |
| 2 | [zen-cognitive-director](./phase-02-zen-cognitive-director.md) | Completed |
| 3 | [cook-deterministic-tdd-runner](./phase-03-cook-deterministic-tdd-runner.md) | Completed |
| 4 | [goal-milestone-manager-and-api](./phase-04-goal-milestone-manager-and-api.md) | Completed |
| 5 | [e2e-factory-integration-and-verification](./phase-05-e2e-factory-integration-and-verification.md) | Completed |

## Architectural Invariants

1. **Zero External Dependencies**: Exclusively native Node.js built-ins (`node:http`, `node:sqlite`, `node:crypto`, `node:events`, `node:child_process`).
2. **Apple Silicon Metal GPU Protection**: Concurrency strictly capped at 1 for local inference via `ConcurrencyGate`.
3. **Strict < 200 LOC Ceiling**: Enforced across every single source and test file.
4. **Deterministic TDD**: Red -> Green -> Refactor cycle with 5-iteration circuit breaker and rollback safety.
