---
title: "Gate 7: Factory Visual Portal & Local Autonomous Agent Harness"
description: "Implementation of Next.js 14 Factory Dashboard, SSE real-time sync, embedded diagnostic UI, and local model XML tool parser & context compactor."
status: completed
priority: P1
branch: "main"
tags: [frontend, dashboard, sse, factory, tool-runner, context-compactor, metal-gpu]
blockedBy: ["261009-gate6-zen-cook-goal-workflows"]
blocks: []
created: "2026-10-09T20:25:00.000Z"
completed: "2026-10-09T21:40:00.000Z"
createdBy: "ck:plan"
source: skill
---

# Gate 7: Factory Visual Portal & Local Autonomous Agent Harness

## Overview
Connect the developer experience to Gate 6 AI Factory engines (`/zen`, `/cook`, `/goal`) via Next.js 14 and embedded dashboard, while providing an XML tool execution parser and sliding-window context compactor for local models.

## Phases

| Phase | Name | Status |
|---|---|---|
| 1 | [factory-frontend-types-and-client](./phase-01-factory-frontend-types-and-client.md) | Complete |
| 2 | [visual-factory-ui-components](./phase-02-visual-factory-ui-components.md) | Complete |
| 3 | [factory-sse-streaming-hook](./phase-03-factory-sse-streaming-hook.md) | Complete |
| 4 | [embedded-dashboard-and-tool-parser](./phase-04-embedded-dashboard-and-tool-parser.md) | Complete |
| 5 | [context-compactor-and-e2e-verification](./phase-05-context-compactor-and-e2e-verification.md) | Complete |

## Invariants
1. **< 200 LOC per file** across all new TypeScript, JavaScript, and test files (79/79 files verified).
2. **0 external proxy dependencies** (100% native Node.js built-ins).
3. **Apple Silicon Metal Protection**: Concurrency strictly capped at 1 for local inference.
4. **100% Green Tests** (136/136 tests passing) and zero `:any` in TypeScript frontend.
