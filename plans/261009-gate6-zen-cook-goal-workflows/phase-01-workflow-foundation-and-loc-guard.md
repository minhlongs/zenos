# Phase 1: Workflow Foundation & LOC Guard

## Overview
Establish the foundational infrastructure for the Gate 6 AI Factory:
1. `loc-guard.js`: Deterministic line-of-code scanner enforcing strict `< 200 LOC` invariant with early warning at 180 LOC and file exclusion patterns.
2. `task_checkpoints` SQLite Schema: Add checkpoints table migration to `task-store.js` allowing transactional snapshots (`phase`, `state`, `artifacts`, `timestamp`).

## Requirements
- `validateFile(filePath)` returns `{ valid, lines, warning }`.
- `validateFiles(filePaths)` scans multiple files.
- `TaskStore` supports `saveCheckpoint(taskId, phase, state, artifacts)` and `getLatestCheckpoint(taskId)`.
- All tests pass with 100% coverage in Node.js test runner.
- Every file strictly `< 200 LOC`.

## Related Files
- Create: `proxy/src/workflow/loc-guard.js`
- Modify: `proxy/src/task-store.js`
- Create: `proxy/tests/loc-guard.test.js`
- Create: `proxy/tests/task-checkpoints.test.js`
