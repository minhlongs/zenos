---
title: "Gate 2: Model Router, Failover & Concurrency Management"
description: "Implementation of intelligent Anthropic-to-local model aliasing, Apple Silicon Metal GPU concurrency gating, and resilient upstream failover."
status: complete
priority: P1
branch: "main"
tags: [proxy, router, tdd, failover, queue]
blockedBy: []
blocks: []
created: "2026-10-09T11:10:34.664Z"
createdBy: "ck:plan"
source: skill
---

# Gate 2: Model Router, Failover & Concurrency Management

## Overview

Build and integrate the reliability and model orchestration layer for the ZenOS local workstation. This enables Claude Code to route requests seamlessly to local LM Studio models via alias mapping, eliminates out-of-memory kernel panics on Apple Silicon through an in-memory admission control queue, and ensures uncompromised availability with automated upstream failover.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [test-suite-architecture](./phase-01-test-suite-architecture.md) | Complete |
| 2 | [model-router](./phase-02-model-router.md) | Complete |
| 3 | [concurrency-gate](./phase-03-concurrency-gate.md) | Complete |
| 4 | [upstream-failover](./phase-04-upstream-failover.md) | Complete |
| 5 | [app-integration-and-verification](./phase-05-app-integration-and-verification.md) | Complete |

## Architectural Invariants

1. **Zero New Dependencies:** Implemented strictly using native Node.js (`node:events`, `node:http`, async promises).
2. **File LOC Bounds:** Every source and test module strictly < 200 lines of code.
3. **Loopback Protection:** All upstream and failover URLs must pass loopback SSRF verification (`validateUpstreamUrl`).
4. **Deterministic Testing:** 100% self-contained mock HTTP servers on ephemeral port 0 with zero live LLM dependencies.
