---
title: "Gate 10: Automated Evaluation, Benchmark Suites & Self-Correction Feedback Loops"
description: "Deterministic SWE micro-benchmarks, diagnostic stack extraction, Reflexion self-correction loop, SQLite eval metrics, and Next.js EvalConsole."
status: completed
priority: P1
branch: "main"
tags: [evaluation, benchmarks, reflexion, self-correction, sqlite, apple-silicon, sse]
blockedBy: ["261009-gate9-autonomous-react-agent-and-tool-harness"]
blocks: []
created: "2026-10-10T00:15:00.000Z"
createdBy: "ck:plan"
source: skill
---

# Gate 10: Automated Evaluation, Benchmark Suites & Self-Correction Feedback Loops

## Overview
Implement an automated evaluation engine for local coding agents running on Apple Silicon, featuring a deterministic SWE micro-benchmark suite, a diagnostic stack extractor, a multi-turn Reflexion (Critique-Revision) self-correction loop, SQLite scoring persistence, and a real-time Next.js operator console.

## Phases

| Phase | Name | Status |
|---|---|---|
| 1 | [diagnostic-and-eval-benchmarks](./phase-01-diagnostic-and-eval-benchmarks.md) | Complete |
| 2 | [reflexion-self-correction-loop](./phase-02-reflexion-self-correction-loop.md) | Complete |
| 3 | [eval-runner-and-sqlite-store](./phase-03-eval-runner-and-sqlite-store.md) | Complete |
| 4 | [routes-and-frontend-eval-console](./phase-04-routes-and-frontend-eval-console.md) | Complete |
| 5 | [verification-and-loc-guard](./phase-05-verification-and-loc-guard.md) | Complete |

## Invariants
1. **< 200 LOC per file** across all source and test modules.
2. **0 external npm dependencies** in proxy backend (pure Node.js).
3. **Metal GPU Single-Concurrency**: Serialized inference execution via `ConcurrencyGate`.
4. **Sandboxed Command Execution**: Benchmark tests executed inside `ProcessJail` with detached PGID.
5. **Durable Persistence**: Transactional metrics recorded in SQLite `task_store`.
