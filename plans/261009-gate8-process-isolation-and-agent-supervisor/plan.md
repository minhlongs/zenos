---
title: "Gate 8: Workstation Sandboxing, Process Isolation & Agent Supervisor"
description: "Process tree management via detached PGID, SQLite checkpoint crash recovery, and autonomous supervisor daemon."
status: completed
priority: P1
branch: "main"
tags: [sandboxing, process-jail, supervisor, recovery, sqlite, metal-gpu]
blockedBy: ["261009-gate7-factory-dashboard-and-agent-harness"]
blocks: []
created: "2026-10-09T23:30:00.000Z"
createdBy: "ck:plan"
source: skill
---

# Gate 8: Workstation Sandboxing, Process Isolation & Agent Supervisor

## Overview
Implement zero-dependency workstation sandboxing and process isolation with detached Process Group IDs (PGID) and an autonomous Agent Supervisor daemon with SQLite crash reconciliation.

## Phases

| Phase | Name | Status |
|---|---|---|
| 1 | [process-jail-pgid-isolation](./phase-01-process-jail-pgid-isolation.md) | Completed |
| 2 | [agent-supervisor-and-reconciler](./phase-02-agent-supervisor-and-reconciler.md) | Completed |
| 3 | [supervisor-sse-and-api-integration](./phase-03-supervisor-sse-and-api-integration.md) | Completed |
| 4 | [frontend-supervisor-monitor](./phase-04-frontend-supervisor-monitor.md) | Completed |
| 5 | [verification-and-loc-guard](./phase-05-verification-and-loc-guard.md) | Completed |

## Invariants
1. **< 200 LOC per file** across all source and test modules.
2. **0 external npm dependencies** in proxy backend.
3. **100% Process Tree Cleanup**: Zero orphaned child processes on timeout or abort via `-pgid` signals.
4. **Crash Recovery**: Automatic startup recovery marking interrupted tasks in SQLite.
5. **Apple Silicon Metal Protection**: Single concurrency enforcement.
