# Phase 4: Goal Milestone Manager & Factory Routes (`/goal`)

## Overview
Implement `proxy/src/workflow/goal-manager.js` and `proxy/src/workflow/routes-factory.js`:
- Lifecycle state machine: `IDLE` -> `PLANNING` -> `COOKING` -> `VERIFYING` -> `PAUSED` -> `COMPLETED`.
- Checkpointing state changes to SQLite `task_checkpoints`.
- Pause, resume, and abort controls without context loss.
- Expose REST endpoints: `/v1/factory/zen`, `/v1/factory/cook`, `/v1/factory/goal` and SSE on `/v1/factory/events`.

## Requirements
- State transitions are strictly guarded and emit telemetry events.
- Resumes goals cleanly from SQLite checkpoint.
- Full HTTP and SSE endpoints functional on proxy server.
- All files strictly `< 200 LOC`.

## Related Files
- Create: `proxy/src/workflow/goal-manager.js`
- Create: `proxy/src/workflow/routes-factory.js`
- Create: `proxy/tests/goal-manager.test.js`
- Create: `proxy/tests/routes-factory.test.js`
