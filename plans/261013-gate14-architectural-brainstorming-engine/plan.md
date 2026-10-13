---
title: "Gate 14: Autonomous Architectural Brainstorming & Deep Refactoring Engine"
description: "Zero-dependency Socratic debate engine, quantitative Architectural Risk Index (ARI) calculator, Pareto strategy synthesis, and Next.js BrainstormConsole UI."
status: complete
priority: P1
branch: "main"
tags: [brainstorming, socratic-debate, architectural-risk-index, pareto-synthesis, refactor, nextjs]
blockedBy: ["261012-gate13-worktree-isolation-and-blast-radius"]
blocks: []
created: "2026-10-13T07:50:00.000Z"
createdBy: "ck:plan"
source: skill
---

# Gate 14: Autonomous Architectural Brainstorming Engine (`/brainstorming --deep`)

## Overview
Implement an autonomous architectural brainstorming engine in pure Node.js (0 external npm dependencies). The engine performs deep architectural analysis, coordinates multi-turn Socratic debates between Advocate, Adversary, and Synthesizer personas, computes the quantitative Architectural Risk Index ($ARI = w_1 \cdot BR + w_2 \cdot CC + w_3 \cdot IR + w_4 \cdot CP$), synthesizes Pareto-optimal refactoring strategies, mounts on `/v1/factory/brainstorm/*`, and provides a cyber-minimalist Next.js `BrainstormConsole`.

## Phases

| Phase | Name | Description | Status |
|---|---|---|---|
| 1 | [ari-calculator](./phase-01-ari-calculator.md) | Architectural Risk Index quantitative model | Complete |
| 2 | [debate-protocol-and-engine](./phase-02-debate-protocol-and-engine.md) | Socratic dialectic loop & strategy synthesis | Complete |
| 3 | [routes-and-factory-mount](./phase-03-routes-and-factory-mount.md) | Brainstorm router & SSE integration | Complete |
| 4 | [brainstorm-console-ui](./phase-04-brainstorm-console-ui.md) | Next.js BrainstormConsole and debate feed | Complete |

## Strict Invariants
1. **< 200 LOC per file** across all proxy source/test modules and frontend components.
2. **0 external npm dependencies** in proxy backend.
3. **Zero `:any` types** in TypeScript frontend.
4. **Non-blocking cooperative event loop** adhering to Apple Silicon Metal protection.
