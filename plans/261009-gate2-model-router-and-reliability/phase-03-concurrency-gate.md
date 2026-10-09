---
phase: 3
title: "concurrency-gate"
status: complete
effort: "medium"
---

# Phase 3: Concurrency Gate & Admission Control Queue

## Overview

Implement an in-memory admission control queue (`proxy/src/queue.js`) to protect Apple Silicon unified memory and Metal GPU from out-of-memory kernel panics. In accordance with user selection ("cả" - both serial queueing and bypass option), the gate serializes concurrent inference requests (default `concurrency = 1`) while supporting backpressure limits, timeouts, cancellation cleanup, and bypass execution.

## Key Insights

- Apple Silicon Metal GPU panics or undergoes extreme swap thrashing when multiple large local LLM inference jobs execute in parallel.
- Serialized queue (`concurrency = 1`) guarantees deterministic memory footprint and maximum inference throughput.
- User choice: bypass header (`x-zenos-bypass-queue: true`) or configuration (`CONCURRENCY_LIMIT=0`) allows direct non-queued execution when desired.
- Zero external dependencies: implemented using native JavaScript promises and `node:events`.
- Code budget: `proxy/src/queue.js` strictly < 200 LOC.

## Related Code Files

- Create: `proxy/src/queue.js`
- Modify: `proxy/src/config.js` (add concurrency limits, queue depth, queue timeout)
- Test: `proxy/tests/concurrency-gate.test.js`

## Implementation Steps

1. **Update `proxy/src/config.js`:**
   - Parse `CONCURRENCY_LIMIT` (default: `1`, `0` = bypass/disabled).
   - Parse `MAX_QUEUE_DEPTH` (default: `10`).
   - Parse `QUEUE_TIMEOUT_MS` (default: `60000` / 60 seconds).

2. **Implement `proxy/src/queue.js`:**
   - Class `ConcurrencyGate`:
     - Constructor accepting `{ concurrency, maxQueueDepth, queueTimeoutMs }`.
     - State tracking: `runningCount`, `waitingQueue: Array<{ task, resolve, reject, timer, clientSignal }>`.
     - Method `enqueue(taskFn, clientSignal, options)`:
       - If `concurrency <= 0` or `options.bypass`: immediately execute `taskFn()`.
       - If `runningCount < concurrency`: increment `runningCount`, execute `taskFn()`, and in `finally` decrement and drain next item.
       - If `waitingQueue.length >= maxQueueDepth`: reject immediately with `QueueOverloadError` (mapped to HTTP 503).
       - Enqueue pending task with timeout timer (`QUEUE_TIMEOUT_MS`).
       - Attach listener to `clientSignal`: if client aborts before execution starts, remove from `waitingQueue`, clear timer, and reject with `AbortError`.
     - Method `getMetrics()`: returns `{ running: runningCount, queued: waitingQueue.length }`.

3. **Verify with TDD Suite:**
   - Run `node --test tests/concurrency-gate.test.js`.
   - Verify serialization, backpressure 503, client abort cleanup, and timeout behavior pass green.

## Success Criteria

- [ ] `proxy/src/queue.js` implemented with clean promise-based admission control < 200 LOC.
- [ ] Proper cancellation semantics: aborted client sockets do not hold queue slots or execute dead inference tasks.
- [ ] 100% of unit tests in `proxy/tests/concurrency-gate.test.js` pass cleanly.
