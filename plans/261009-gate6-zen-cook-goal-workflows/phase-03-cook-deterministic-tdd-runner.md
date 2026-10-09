# Phase 3: Cook Deterministic TDD Runner (`/cook`)

## Overview
Implement `proxy/src/workflow/cook-runner.js`:
- Executes Red -> Green -> Refactor cycle using `node:child_process`.
- Manages 5-iteration circuit breaker to halt runaway loops.
- Interlocks with `loc-guard.js` to reject any code changes exceeding 200 LOC.
- Integrates with workspace path jail (`path-guard.js`) and command security (`command-guard.js`).

## Requirements
- `runCycle({ testCommand, targetFiles, maxIterations })` returning execution status and step history.
- Halts with `CIRCUIT_BREAKER_TRIGGERED` on 5 consecutive failures.
- Enforces `< 200 LOC` validation on all touched files before declaring GREEN.
- Strict `< 200 LOC` invariant for runner implementation.

## Related Files
- Create: `proxy/src/workflow/cook-runner.js`
- Create: `proxy/tests/cook-runner.test.js`
