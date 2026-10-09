---
title: "Gate 3: Durable Task State & Memory Architecture"
description: "Unified durable persistence combining native node:sqlite, atomic JSONL/Markdown episodic memory, and proxy-integrated session/task lifecycle management."
status: complete
priority: P1
branch: "main"
tags: [storage, sqlite, memory, sessions, tasks, tdd]
blockedBy: ["261009-gate2-model-router-and-reliability"]
blocks: []
created: "2026-10-09T18:45:00.000Z"
createdBy: "ck:plan"
source: skill
---

# Gate 3: Durable Task State & Memory Architecture

## Overview

Architect and implement the durable persistence and memory subsystem for ZenOS local workstation. This synthesizes all 3 core user requirements:
1. **`node:sqlite` Native Storage Engine**: High-performance structured storage with WAL mode for sessions, tasks, and telemetry.
2. **Atomic JSONL & Markdown Episodic Memory**: Human-readable, crash-proof atomic writes (`tempfile` -> `fs.rename`) for episodic notes and append-only audit trails.
3. **Proxy-Integrated State & API**: Expose `/v1/sessions`, `/v1/tasks`, and `/v1/memory` REST contracts directly within the proxy, linking Claude Code messages to durable tasks with automatic session checkpointing.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [sqlite-engine](./phase-01-sqlite-engine.md) | Complete |
| 2 | [atomic-file-and-markdown](./phase-02-atomic-file-and-markdown.md) | Complete |
| 3 | [task-and-session-store](./phase-03-task-and-session-store.md) | Complete |
| 4 | [proxy-endpoints-integration](./phase-04-proxy-endpoints-integration.md) | Complete |
| 5 | [verification-and-hardening](./phase-05-verification-and-hardening.md) | Complete |

## Architectural Invariants

1. **Zero New Dependencies**: 100% native Node.js (`node:sqlite`, `node:fs`, `node:path`, `node:crypto`).
2. **File LOC Bounds**: Every source and test module strictly < 200 lines of code.
3. **Atomic File Guarantees**: No partial writes or corruption on crash; write to `.tmp` then atomic rename.
4. **Crash Recoverability**: Tasks interrupted in `running` state are automatically marked `interrupted` or resumed on startup.
5. **Deterministic TDD**: 100% in-memory / temporary-directory tests with complete cleanup.
