---
title: "Phase 4: Next.js Deep Brainstorm Console & Strategy Panel UI"
status: in_progress
---

# Phase 4: Next.js Deep Brainstorm Console & Strategy Panel UI

## Context Links
- `/Users/macbook/ZenOS/plans/reports/researcher-gate15-deep-brainstorming-ui.md`
- `/Users/macbook/ZenOS/frontend/src/types/brainstorm.ts`
- `/Users/macbook/ZenOS/frontend/src/lib/zenos-brainstorm-client.ts`
- `/Users/macbook/ZenOS/frontend/src/components/BrainstormConsole.tsx`

## Requirements
- Extend `frontend/src/types/brainstorm.ts` (< 90 LOC) with `CROSS_EXAMINER` and `REBUTTAL` personas, `CodebaseTelemetry`, `ModuleSplitBlueprint`, and `deep` session properties (`0 :any` types).
- Extend `frontend/src/lib/zenos-brainstorm-client.ts` (< 95 LOC) with `autoBrainstormHotspots(limit)` and `deep` parameter support in `startBrainstormSession`.
- Create `frontend/src/components/BrainstormStrategyPanel.tsx` (< 115 LOC) to render Pareto strategies, ARI risk badges, Module Split Blueprint preview, and `/zen` dispatch status.
- Update `frontend/src/components/BrainstormConsole.tsx` (< 145 LOC) with `--deep` mode toggle, one-click **"Auto-Scan & Brainstorm Hotspots"** button, Live Codebase Telemetry bar (`LOC`, `CCN`, `Fan-In/Out`, `Seams`), and 5-persona Socratic feed (`ADVOCATE` emerald, `ADVERSARY` rose, `CROSS_EXAMINER` violet, `REBUTTAL` amber, `SYNTHESIZER` cyan).
