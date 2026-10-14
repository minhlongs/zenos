---
title: "Phase 2: 5-Turn Socratic Cross-Examination & Auto-Hotspots Engine"
status: in_progress
---

# Phase 2: 5-Turn Socratic Cross-Examination & Auto-Hotspots Engine

## Context Links
- `/Users/macbook/ZenOS/proxy/src/workflow/debate-protocol.js`
- `/Users/macbook/ZenOS/proxy/src/workflow/brainstorm-engine.js`

## Requirements
- Upgrade `proxy/src/workflow/debate-protocol.js` (< 130 LOC):
  - Add `generateCrossExaminerTurn(topic, context)` (`CROSS_EXAMINER` persona: Socratic Seam & Invariant Auditor).
  - Add `generateRebuttalTurn(topic, context)` (`REBUTTAL` persona: Architectural Seam Defender & Facade Architect).
  - Enrich `generateSynthesizerTurn` with concrete `splitBlueprint` and a 3rd candidate strategy (`Incremental Strangler Seam`) when `deep` mode is active.
- Upgrade `proxy/src/workflow/brainstorm-engine.js` (< 165 LOC):
  - Integrate `DeepCodeInspector` to auto-populate live file telemetry and `splitBlueprint` when `targetFile` is supplied.
  - Support `deep: true` mode executing 5 Socratic turns (`ADVOCATE` -> `ADVERSARY` -> `CROSS_EXAMINER` -> `REBUTTAL` -> `SYNTHESIZER`) with cooperative event-loop yields.
  - Add `autoBrainstormHotspots(limit = 3)` to scan top codebase hotspots and run deep Socratic sessions automatically.
- Update `proxy/tests/brainstorm-engine.test.js` (< 120 LOC) to test `--deep` 5-turn sessions and `autoBrainstormHotspots`.
