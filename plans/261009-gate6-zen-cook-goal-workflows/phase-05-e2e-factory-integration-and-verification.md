# Phase 5: E2E Factory Integration & Verification

## Overview
Implement master coordinator `factory-engine.js`, thin CLI dispatchers (`bin/zen`, `bin/cook`, `bin/goal`), and verify end-to-end integration:
- Connect `zen-director`, `cook-runner`, and `goal-manager` under `factory-engine.js`.
- Mount `/v1/factory` routes onto `proxy/src/index.js`.
- Provide executable CLI scripts in `cli/bin/`.
- Verify full test suite passes with 0 failures and all files `< 200 LOC`.

## Requirements
- `FactoryEngine` coordinates complete goal execution flow.
- Thin CLI binaries dispatch HTTP requests with proper error handling.
- 100% green tests in `proxy/tests/`.
- Strict `< 200 LOC` invariant audit across the repository.

## Related Files
- Create: `proxy/src/workflow/factory-engine.js`
- Modify: `proxy/src/index.js`
- Create: `cli/bin/zen`, `cli/bin/cook`, `cli/bin/goal`
- Create: `proxy/tests/factory-engine.test.js`
- Create: `proxy/tests/e2e-factory.test.js`
