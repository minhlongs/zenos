# Phase 5: Sliding-Window Context Compactor & E2E Verification

## Context Links
- Plan: [plan.md](./plan.md)
- Report: [researcher-gate7-local-agent-harness.md](../reports/researcher-gate7-local-agent-harness.md)

## Overview
- Priority: P1
- Status: Pending
- Description: Implement `context-compactor.js` for local models (4k rolling buffer + dynamic summary), write unit tests, verify frontend build, and audit repository LOC invariant.

## Requirements
- `proxy/src/workflow/context-compactor.js`: Fast sliding-window compactor with token count estimator.
- `proxy/tests/context-compactor.test.js`: Comprehensive tests covering compaction, threshold triggers, and summary retention.
- Zero `:any` types in TypeScript.
- `npm test` passes 100% green.
- `npm run build` succeeds in `frontend/`.
- All files strictly < 200 LOC verified via `loc-guard.js`.

## Related Code Files
- Create: `proxy/src/workflow/context-compactor.js`
- Create: `proxy/tests/context-compactor.test.js`

## Todo List
- [ ] Implement `context-compactor.js` (< 200 LOC).
- [ ] Implement `proxy/tests/context-compactor.test.js` (< 200 LOC).
- [ ] Run all backend unit tests (`npm test`).
- [ ] Run Next.js frontend typecheck/build.
- [ ] Run `loc-guard.js` across entire codebase.
