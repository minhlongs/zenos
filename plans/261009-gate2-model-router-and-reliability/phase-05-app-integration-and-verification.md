---
phase: 5
title: "app-integration-and-verification"
status: complete
effort: "medium"
---

# Phase 5: App Integration & End-to-End Verification

## Overview

Integrate the Model Router, Concurrency Gate, and Failover Dispatcher into the main Express application (`proxy/src/app.js`). Update error mapping to return compliant Anthropic JSON errors for queue saturation and failover exhaustion. Enhance `/health` to expose observability into active queue depth and upstream status. Execute the comprehensive test suite to verify 100% test pass rate with zero regressions.

## Key Insights

- `proxy/src/app.js` is currently 173 LOC, strictly adhering to the `< 200 LOC` invariant.
- Pipeline flow in `/v1/messages`:
  1. Validate incoming requested model.
  2. Resolve model name via `resolveModel(body.model)`.
  3. Validate model capabilities via `validateCapabilities()`.
  4. Translate Anthropic payload to OpenAI schema.
  5. Pass request task into `concurrencyGate.enqueue()`.
  6. Inside gate task, execute request via `executeWithFailover()`.
  7. Return translated JSON or stream SSE chunks to client.
- Zero breaking changes to existing Gate 1 contracts.

## Related Code Files

- Modify: `proxy/src/app.js`
- Modify: `proxy/src/errors.js` (add Gate 2 error mappers: 503 overloaded, 502 bad gateway)
- Test: `proxy/tests/health-models.test.js` (verified queue and upstream metrics)
- Test: Full test suite (`npm test`)

## Implementation Steps

1. **Update `proxy/src/errors.js`:**
   - Map `QueueOverloadError` to HTTP 503 with Anthropic type `overloaded_error`.
   - Map `AllUpstreamsFailedError` to HTTP 502 with Anthropic type `api_error`.
   - Map `CapabilityError` to HTTP 400 with Anthropic type `invalid_request_error`.

2. **Wire Gate 2 Modules into `proxy/src/app.js`:**
   - Instantiate `ConcurrencyGate` in `createApp(options)`.
   - Wire `resolveModel` into `/v1/messages` handler to translate `req.body.model`.
   - Enqueue downstream dispatch through `gate.enqueue(...)`.
   - Support `x-zenos-bypass-queue` and `x-bypass-queue` headers for manual bypass.
   - Dispatch inference via `executeWithFailover(...)` for both non-streaming and streaming requests.
   - Update `GET /health` to include `{ status: 'ok', queue: gate.getMetrics(), upstreams: UPSTREAM_URLS }`.

3. **Verify Complete Test Suite:**
   - Run `npm test` (`node --test tests/*.js`).
   - Confirmed 54 of 54 tests pass cleanly across all 14 test suites.
   - Check file lengths: ensure every file in `proxy/src/` is strictly < 200 LOC.

4. **Git Commit & Documentation:**
   - Update `plans/261009-gate2-model-router-and-reliability/plan.md` statuses.
   - Commit cleanly with conventional commit message adhering to repository attribution guidelines.

## Success Criteria

- [x] All modules in `proxy/src/` (`app.js`, `router.js`, `queue.js`, `failover.js`, `errors.js`) strictly < 200 LOC.
- [x] `/health` reports live queue metrics and registered upstreams.
- [x] End-to-end request pipeline works seamlessly with aliasing, queue serialization, and upstream fallback.
- [x] 100% of tests in `proxy/tests/` pass cleanly with zero skipped or flaky tests (54/54 passed).
