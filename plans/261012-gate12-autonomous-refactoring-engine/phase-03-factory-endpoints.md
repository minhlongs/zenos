# Phase 3: Factory API Endpoints & SSE Streaming

## Context Links
- Plan: [plan.md](./plan.md)
- Phase 1: [phase-01-complexity-engine.md](./phase-01-complexity-engine.md)
- Phase 2: [phase-02-refactor-controller.md](./phase-02-refactor-controller.md)
- Research: [researcher-gate12-complexity-heatmaps-and-self-healing.md](../reports/researcher-gate12-complexity-heatmaps-and-self-healing.md)
- Existing Reference: `proxy/src/workflow/routes-factory.js:13` (`createFactoryRouter`)

## Overview
Implement `proxy/src/workflow/routes-refactor.js` to expose the refactoring engine over HTTP and Server-Sent Events (SSE). Mount this sub-router inside `routes-factory.js` under the prefix `/refactor`. This allows local operators and automated agents to trigger repository complexity scans, review generated slicing plans, execute consensus-gated refactors, and stream real-time progression events.

## Requirements

### 1. HTTP Endpoint Specifications
- **`POST /v1/factory/refactor/analyze`**
  - **Request Body**: `{ path?: string, recursive?: boolean, threshold?: number }`
  - Default `path` is project root (`process.cwd()`).
  - Calls `ComplexityEngine.analyzeDirectory(targetPath)`.
  - **Response 200**:
    ```json
    {
      "workspaceHealthScore": 82,
      "totalFiles": 45,
      "highRiskFilesCount": 3,
      "files": [
        {
          "filePath": "proxy/src/workflow/monolith.js",
          "totalLines": 284,
          "codeLines": 210,
          "branchingCount": 28,
          "monolithScore": 84,
          "riskLevel": "CRITICAL"
        }
      ]
    }
    ```

- **`POST /v1/factory/refactor/plan`**
  - **Request Body**: `{ filePath: string, targetMaxLoc?: number }`
  - Validates `filePath` existence.
  - Calls `RefactorController.generateSlicePlan(filePath, { targetMaxLoc })`.
  - **Response 200**:
    ```json
    {
      "targetFile": "proxy/src/workflow/monolith.js",
      "currentLoc": 284,
      "plan": {
        "slices": [
          { "submodule": "monolith-helpers.js", "estimatedLoc": 110, "symbols": ["formatPayload"] },
          { "submodule": "monolith-core.js", "estimatedLoc": 140, "symbols": ["MonolithCore"] }
        ],
        "barrelFacade": "export * from './monolith-helpers'; ...",
        "postRefactorTargetLoc": 35
      }
    }
    ```

- **`POST /v1/factory/refactor/apply`**
  - **Request Body**: `{ plan: object, testCommand?: string, dryRun?: boolean }`
  - Calls `RefactorController.applyPlan(plan, { testCommand, dryRun })`.
  - Emits SSE events during execution: `refactor_start`, `refactor_slice_written`, `refactor_test_running`, `refactor_consensus_evaluated`, `refactor_complete` (or `refactor_rollback`).
  - **Response 200** (or **422** on consensus rejection):
    ```json
    {
      "success": true,
      "status": "APPROVED",
      "consensus": {
        "approved": true,
        "key1": { "passed": true, "reason": "All 18 tests passed" },
        "key2": { "approved": true, "reason": "All files <= 200 LOC" }
      },
      "createdFiles": ["proxy/src/workflow/monolith-helpers.js", "proxy/src/workflow/monolith-core.js"],
      "modifiedFiles": ["proxy/src/workflow/monolith.js"]
    }
    ```

- **`GET /v1/factory/refactor/events`** (or shared via `/v1/factory/events`)
  - Dedicated SSE stream for refactor events if queried directly, or broadcasted to factory-wide SSE subscribers.

### 2. Integration with `routes-factory.js`
- In `proxy/src/workflow/routes-factory.js:143`, register:
  ```js
  router.use('/refactor', createRefactorRouter({
    ...options,
    broadcast
  }));
  ```

## Related Code Files
- Create: `proxy/src/workflow/routes-refactor.js` (< 200 LOC)
- Modify: `proxy/src/workflow/routes-factory.js` (< 200 LOC)
- Create: `proxy/tests/routes-refactor.test.js` (< 200 LOC)

## Implementation Steps
1. Create `proxy/src/workflow/routes-refactor.js`:
   - Initialize Express router.
   - Inject `ComplexityEngine` and `RefactorController`.
   - Wire `/analyze`, `/plan`, `/apply` route handlers with input validation.
   - Wire SSE broadcast hooks for status transitions.
2. Update `proxy/src/workflow/routes-factory.js`:
   - Require `createRefactorRouter` from `./routes-refactor`.
   - Mount `/refactor` sub-router with options and `broadcast`.
3. Create `proxy/tests/routes-refactor.test.js`:
   - Test endpoints using mock Express request/response or `node:http`.
   - Verify 400 responses on missing payload fields.
   - Verify SSE event emission during `/apply`.
   - Verify error responses when refactor fails consensus.
   - Run tests with `node --test proxy/tests/routes-refactor.test.js`.

## Success Criteria
- [ ] `routes-refactor.js` is under 200 LOC.
- [ ] `routes-factory.js` successfully mounts `/refactor` without exceeding 200 LOC.
- [ ] Endpoints `/v1/factory/refactor/analyze`, `/plan`, and `/apply` return correct JSON payloads and status codes.
- [ ] SSE broadcasts stream refactor execution stages in real-time.
- [ ] 100% test pass rate in `proxy/tests/routes-refactor.test.js`.

## Risk Assessment & Mitigation
- **Risk**: Long-running test execution during `/apply` triggers HTTP timeouts.
- **Mitigation**: Return status 202 Accepted for asynchronous execution with task ID tracking, or stream progress via SSE while keeping HTTP response open with chunked transfer.
