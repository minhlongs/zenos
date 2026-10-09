---
title: "Gate 5: Minimal Operational Dashboard and Observability"
description: "Zero-dependency embedded proxy dashboard with SSE telemetry, dedicated /v1/telemetry endpoint, and Next.js frontend integration."
status: complete
priority: P1
branch: "main"
tags: [dashboard, observability, telemetry, sse, frontend, tdd]
blockedBy: ["261009-gate4-verification-security-approval"]
blocks: ["261009-gate6-zen-cook-goal-workflows"]
created: "2026-10-09T19:35:00.000Z"
createdBy: "ck:plan"
source: skill
---

# Gate 5: Minimal Operational Dashboard and Observability

## Overview

Deliver comprehensive observability and an operational dashboard for the ZenOS personal AI workstation across all 3 user-selected pillars:
1. **Telemetry & Metrics Engine (`telemetry.js`)**: Lightweight, in-memory telemetry recording request latency, throughput, error rates, and model usage percentiles.
2. **REST & SSE Telemetry Routes (`routes-telemetry.js`)**: Expose `/v1/telemetry` for metric aggregation and `/v1/telemetry/events` for real-time Server-Sent Events (SSE).
3. **Zero-Dependency Embedded Dashboard (`dashboard.js`, `routes-dashboard.js`, `dashboard-html.js`)**: Built-in Web dashboard served at `/dashboard` with zero build step, live SSE updates, and human approval resolution buttons.
4. **Next.js Frontend Integration (`frontend/`)**: Modern React/TypeScript components, dashboard page, and proxy API client (`zenos-client.ts`).
5. **End-to-End Verification & LOC Audit**: 100% green test suite (100/100 tests), zero external proxy dependencies, and all files strictly < 200 LOC.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [telemetry-engine](./phase-01-telemetry-engine.md) | Complete |
| 2 | [telemetry-routes-and-sse](./phase-02-telemetry-routes-and-sse.md) | Complete |
| 3 | [embedded-proxy-dashboard](./phase-03-embedded-proxy-dashboard.md) | Complete |
| 4 | [nextjs-frontend-integration](./phase-04-nextjs-frontend-integration.md) | Complete |
| 5 | [verification-and-hardening](./phase-05-verification-and-hardening.md) | Complete |

## Architectural Invariants

1. **Zero External Proxy Dependencies**: 100% native Node.js built-ins.
2. **Strict File LOC Ceiling**: Every source and test file in `proxy/` and `frontend/src/` strictly < 200 lines of code.
3. **Real-time Observability**: Live metrics tracking with SSE streaming and instant state updates.
4. **Deterministic TDD**: All telemetry and dashboard route contracts verified with automated tests.
