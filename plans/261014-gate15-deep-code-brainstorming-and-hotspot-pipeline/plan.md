# Gate 15: Deep Code-Introspective Brainstorming & Hotspot Auto-Refactor Pipeline (`/brainstorming --deep`)

**Status:** Completed
**Date:** 2026-10-14
**Target:** `/Users/macbook/ZenOS`

## Overview
Upgrade ZenOS Architectural Brainstorming to **Gate 15 (`/brainstorming --deep`)** with live AST/lexical codebase introspection (`DeepCodeInspector`), 5-turn Socratic Cross-Examination (`ADVOCATE`, `ADVERSARY`, `CROSS_EXAMINER`, `REBUTTAL`, `SYNTHESIZER`), automatic workspace hotspot discovery & brainstorming (`POST /v1/factory/brainstorm/auto-hotspots`), proactive slicing of `proxy/src/dashboard-html.js` (189 LOC -> `< 110 LOC` submodules), and modularized Next.js `BrainstormConsole` + `BrainstormStrategyPanel` components.

## Phases & File Ownership Matrix
| Phase | Name | Primary Files | Status |
|---|---|---|---|
| **Phase 01** | `DeepCodeInspector` & Dashboard Monolith Slicing | `proxy/src/workflow/deep-code-inspector.js`, `proxy/src/dashboard-client-script.js`, `proxy/src/dashboard-html.js`, `proxy/tests/deep-code-inspector.test.js` | Completed |
| **Phase 02** | 5-Turn Socratic Cross-Examination & Auto-Hotspots Engine | `proxy/src/workflow/debate-protocol.js`, `proxy/src/workflow/brainstorm-engine.js`, `proxy/tests/brainstorm-engine.test.js` | Completed |
| **Phase 03** | Deep Brainstorm Routes (`/auto-hotspots`, `/inspect`) | `proxy/src/workflow/routes-brainstorm.js`, `proxy/tests/routes-brainstorm.test.js` | Completed |
| **Phase 04** | Next.js Deep Brainstorm Console & Strategy Panel UI | `frontend/src/types/brainstorm.ts`, `frontend/src/lib/zenos-brainstorm-client.ts`, `frontend/src/components/BrainstormStrategyPanel.tsx`, `frontend/src/components/BrainstormConsole.tsx` | Completed |

## Acceptance Criteria
1. All files across `proxy/src/`, `proxy/tests/`, and `frontend/src/` are strictly `< 200 LOC`.
2. Zero external npm dependencies added to `proxy/`.
3. Zero `:any` types in TypeScript (`frontend/`).
4. `npm test` in `proxy/` passes 100% green and `npm run build` in `frontend/` compiles with 0 errors.
