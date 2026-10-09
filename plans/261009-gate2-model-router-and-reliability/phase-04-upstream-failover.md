---
phase: 4
title: "upstream-failover"
status: complete
effort: "medium"
---

# Phase 4: Upstream Failover & High Availability Engine

## Overview

Implement a multi-upstream dispatch and failover mechanism in `proxy/src/failover.js` (or enhancing `proxy/src/upstream.js`). In accordance with user selection ("cả" - both aliasing and failover), the proxy dispatches requests to the primary upstream (e.g. LM Studio port 1234) and automatically, transparently falls back to secondary upstreams (e.g. secondary LM Studio instance, Ollama, or backup local runtime on port 11434) if the primary fails with network errors (`ECONNREFUSED`, `ETIMEDOUT`) or 5xx gateway failures.

## Key Insights

- Solo developer workflow demands zero downtime if the primary local model is reloading or crashed.
- All failover endpoints MUST strictly adhere to the loopback SSRF security invariant (`validateUpstreamUrl`).
- Failover should only trigger on recoverable infrastructure faults (connection refused, timeout, 502/503/504), NOT on client 4xx errors (bad requests, schema errors).
- Streaming requests must not fail over mid-stream once bytes have been flushed to the client.
- Code budget: `proxy/src/failover.js` strictly < 200 LOC.

## Related Code Files

- Create: `proxy/src/failover.js`
- Modify: `proxy/src/config.js` (parse `UPSTREAM_ENDPOINTS` array with loopback validation)
- Modify: `proxy/src/upstream.js` (integrate failover dispatcher)
- Test: `proxy/tests/failover.test.js`

## Implementation Steps

1. **Update `proxy/src/config.js`:**
   - Parse `UPSTREAM_ENDPOINTS` (comma-separated list of URLs, default: `[LMSTUDIO_URL]`).
   - Validate each URL in the list against `validateUpstreamUrl` (enforcing loopback IPv4/IPv6).
   - Export sanitized `UPSTREAM_URLS` array.

2. **Implement `proxy/src/failover.js`:**
   - Class/Function `executeWithFailover(upstreamUrls, requestFn, options)`:
     - Iterate through `upstreamUrls` in priority order.
     - Execute `requestFn(url)`.
     - If success: return response immediately.
     - If failure:
       - Check if error is retryable (`ECONNREFUSED`, `ECONNRESET`, `ETIMEDOUT`, or HTTP status 502, 503, 504).
       - If non-retryable (e.g. 400 Bad Request, client abort): throw immediately without trying subsequent upstreams.
       - Log sanitized warning with redacted secrets about failover attempt.
       - Continue to next upstream in list.
     - If all upstreams exhausted: throw `AllUpstreamsFailedError` with composite diagnostic info.

3. **Verify with TDD Suite:**
   - Run `node --test tests/failover.test.js`.
   - Verify primary success, single failover, multi-endpoint failover, and exhaustive failure error cases pass green.

## Success Criteria

- [ ] Loopback SSRF protection strictly enforced across all primary and backup upstream URLs.
- [ ] Transparent failover on transport and 5xx errors; immediate pass-through for client 4xx errors.
- [ ] 100% of unit tests in `proxy/tests/failover.test.js` pass cleanly.
