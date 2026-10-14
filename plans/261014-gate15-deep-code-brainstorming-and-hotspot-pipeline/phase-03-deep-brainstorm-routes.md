---
title: "Phase 3: Deep Brainstorm Routes (/auto-hotspots & /inspect)"
status: in_progress
---

# Phase 3: Deep Brainstorm Routes (`/auto-hotspots` & `/inspect`)

## Context Links
- `/Users/macbook/ZenOS/proxy/src/workflow/routes-brainstorm.js`
- `/Users/macbook/ZenOS/proxy/tests/routes-brainstorm.test.js`

## Requirements
- Extend `proxy/src/workflow/routes-brainstorm.js` (< 120 LOC):
  - `POST /start`: Accept `deep` flag (`boolean`, default `true` when `mode === '--deep'` or `deep === true`) along with `topic`, `targetFile`, `context`.
  - `GET /inspect`: Query live codebase telemetry and module split blueprint for `targetFile` (`?file=...`) or top hotspots.
  - `POST /auto-hotspots`: Trigger `engine.autoBrainstormHotspots(limit)` and broadcast `brainstorm_hotspots_scanned` over SSE.
- Extend `proxy/tests/routes-brainstorm.test.js` (< 120 LOC) to test `/start` with `deep: true`, `/inspect`, and `/auto-hotspots`.
