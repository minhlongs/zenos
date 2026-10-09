---
title: "Gate 9: Autonomous ReAct Agent Loop & Local Tool Harness"
description: "Native zero-dependency tool harness, multi-turn ReAct agent loop, SQLite checkpointing, and live SSE streaming."
status: completed
priority: P1
branch: "main"
tags: [react-agent, tool-harness, sandboxing, sqlite, metal-gpu, sse]
blockedBy: ["261009-gate8-process-isolation-and-agent-supervisor"]
blocks: []
created: "2026-10-09T23:55:00.000Z"
createdBy: "ck:plan"
source: skill
---

# Gate 9: Autonomous ReAct Agent Loop & Local Tool Harness

## Overview
Implement an autonomous multi-turn ReAct (Reason + Act) loop (`react-agent-loop.js`) and a native zero-dependency local tool harness (`tool-harness.js`) with PathGuard and ProcessJail sandboxing, SQLite state checkpointing, and real-time SSE streaming.

## Phases

| Phase | Name | Status |
|---|---|---|
| 1 | [native-tool-harness](./phase-01-native-tool-harness.md) | Completed |
| 2 | [react-agent-loop-engine](./phase-02-react-agent-loop-engine.md) | Completed |
| 3 | [supervisor-and-sse-api](./phase-03-supervisor-and-sse-api.md) | Completed |
| 4 | [frontend-agent-console](./phase-04-frontend-agent-console.md) | Completed |
| 5 | [verification-and-loc-guard](./phase-05-verification-and-loc-guard.md) | Completed |

## Invariants
1. **< 200 LOC per file** across all source and test modules.
2. **0 external npm dependencies** in proxy backend.
3. **Metal GPU Single-Concurrency**: All LLM calls guarded via `ConcurrencyGate`.
4. **Isolated Tool Execution**: All commands executed in `ProcessJail` with detached PGID.
5. **Durable Persistence**: Step-by-step checkpointing in SQLite `TaskStore`.
