---
phase: 1
title: "test-suite-architecture"
status: complete
effort: "medium"
---

# Phase 1: Test Suite Architecture (TDD Fixtures & Contract Tests)

## Overview

Establish the automated TDD test foundation for Gate 2 before writing any runtime routing, queueing, or failover code. In accordance with the TDD selection (`/ck:plan --tdd`), this phase implements contract and unit test specifications with mock HTTP servers to establish deterministic, reproducible assertions for all Gate 2 subsystems.

## Key Insights

- Zero live LLM dependencies: all tests run against native `node:http` servers on ephemeral port `0`.
- Fast feedback loop: whole suite must execute in under 3 seconds using `node --test`.
- Modularity: separate test suites into distinct files strictly under 200 LOC per file to preserve maintainability.

## Related Code Files

- Create: `proxy/tests/router.test.js`
- Create: `proxy/tests/concurrency-gate.test.js`
- Create: `proxy/tests/failover.test.js`
- Read/Reference: `proxy/tests/helpers.js`

## Implementation Steps

1. **Create `proxy/tests/router.test.js`:**
   - Test model alias resolution: exact match, wildcard prefix (e.g. `claude-3-5-sonnet*` -> configured default model), fallback when no alias matches.
   - Test capability discovery: verifying that requests requiring tools fail fast with clear errors if the mapped model does not declare tool support.
   - Test context window boundary validation: rejecting requests with total tokens exceeding `max_context_tokens`.

2. **Create `proxy/tests/concurrency-gate.test.js`:**
   - Test FIFO ordering: multiple concurrent requests execute sequentially in arrival order when `concurrency = 1`.
   - Test queue backpressure: requests exceeding `maxQueueDepth` immediately receive a 503 error with standard Anthropic JSON error envelope.
   - Test client abort handling: disconnecting client socket (`req.on('close')`) while waiting in queue dequeues the item cleanly without executing it.
   - Test queue timeout: requests waiting in queue longer than `queueTimeoutMs` expire and return a 504 error.
   - Test bypass mode: requests marked with bypass or when concurrency is set to 0 execute directly without entering the queue.

3. **Create `proxy/tests/failover.test.js`:**
   - Test primary upstream success: normal request succeeds on primary without contacting secondary.
   - Test primary connection failure (`ECONNREFUSED` / 502 / 504): automatically transparently fails over to secondary upstream.
   - Test all upstreams unavailable: returns 502 Bad Gateway when all configured upstreams fail.
   - Test failover SSRF protection: reject any failover upstream URL that resolves outside loopback.

## Success Criteria

- [ ] `proxy/tests/router.test.js` exists and defines all required model routing and aliasing assertions.
- [ ] `proxy/tests/concurrency-gate.test.js` exists and asserts FIFO queuing, backpressure limits, and cancellation.
- [ ] `proxy/tests/failover.test.js` exists and asserts transparent fallback between primary and secondary endpoints.
- [ ] Running `node --test tests/router.test.js tests/concurrency-gate.test.js tests/failover.test.js` executes and correctly fails (Red phase of TDD) awaiting implementation.
