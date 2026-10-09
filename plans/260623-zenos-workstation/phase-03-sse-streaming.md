---
phase: 3
title: "SSE Streaming & Progress Indicators"
status: planned
priority: P2
effort: "2 days"
dependencies: [2]
---

# Phase 3: SSE Streaming & Progress Indicators — 📋 Planned

## Overview

Implement Server-Sent Events (SSE) streaming endpoints for real-time token delivery and progress tracking for long-running operations. This phase completes the streaming API documented in `docs/API.md`.

## Current State

- ✅ API documentation complete (`docs/API.md`)
- ✅ Non-streaming endpoints working (`/v1/chat/completions`, `/v1/messages`)
- ✅ Model router, adapter, context manager functional
- ❌ Streaming endpoints **NOT** implemented
- ❌ Progress tracking service **NOT** implemented

## Objectives

- [ ] Implement `/v1/chat/completions/stream` endpoint (OpenAI-compatible SSE)
- [ ] Implement `/v1/messages/stream` endpoint (Anthropic-compatible SSE)
- [ ] Create `ProgressTracker` service for callback-based progress reporting
- [ ] Integrate progress callbacks into ContextManager operations
- [ ] Handle LM Studio streaming responses (forward chunks)
- [ ] Proper error handling and connection cleanup
- [ ] Unit tests for streaming handlers (15+ tests)
- [ ] Integration tests for streaming endpoints
- [ ] Update `docs/API.md` with implementation notes

## Architecture

```
Client Request (stream: true)
         ↓
   Express Route Handler
         ↓
   ┌───────────────────────┐
   │  ProgressTracker       │  ← New service
   │  - emitProgress()     │
   │  - callbacks (opt)    │
   └───────────────────────┘
         ↓
   ModelRouter.forward() with streaming
         ↓
   LM Studio (streaming response)
         ↓
   SSE Format Adapter
   (OpenAI or Anthropic)
         ↓
   res.write() chunk by chunk
```

## Implementation

### Files to Create

| File | Purpose |
|------|---------|
| `src/services/progress-tracker.js` | Progress callback management |
| `src/utils/sse-formatter.js` | SSE formatting utilities |
| `src/utils/stream-buffer.js` | Buffered streaming handler |

### Files to Modify

| File | Changes |
|------|---------|
| `src/index.js` | Add `/v1/chat/completions/stream` and `/v1/messages/stream` routes |
| `src/services/anthropic-adapter.js` | Add `formatStreamEvent()` methods |
| `src/services/context-manager.js` | Accept progress callback parameter |
| `src/services/model-router.js` | Support streaming forward mode |
| `tests/test-streaming.js` | New test file (20+ tests) |

## API Endpoints to Implement

### POST /v1/chat/completions/stream

OpenAI-compatible streaming endpoint.

**Request Body:**
```json
{
  "model": "qwen3.6-35b-a3b",
  "messages": [...],
  "max_tokens": 4096,
  "temperature": 0.7,
  "stream": true
}
```

**Response:** `text/event-stream`

**Event Format:**
```json
{
  "id": "chatcmpl_...",
  "object": "chat.completion.chunk",
  "created": 1718888888,
  "model": "...",
  "choices": [{
    "index": 0,
    "delta": {"content": "token"},
    "finish_reason": null
  }]
}
```

### POST /v1/messages/stream

Anthropic-compatible streaming endpoint.

**Request Body:**
```json
{
  "model": "claude-sonnet-4-20250514",
  "messages": [...],
  "max_tokens": 4096,
  "stream": true,
  "system": "..."
}
```

**Response:** `text/event-stream`

**Event Types:** `message_start`, `content_block_start`, `content_block_delta`, `content_block_stop`, `message_delta`, `message_stop`

## Progress Tracking

ContextManager operations will accept optional progress callback:

```javascript
const context = new ContextManager();

await context.enrich(messages, (progress, type) => {
  // Emit SSE progress event
  res.write(formatProgressEvent(progress, type));
});

// Progress types:
// - context_enrich: 0→100 (load + apply)
// - embedding: 0→100 (generate + store)
// - memory_search: 0→100 (embedding + search)
```

## Implementation Steps

### Day 1: Streaming Infrastructure

1. **Create `progress-tracker.js`** (3h)
   - `ProgressTracker` class
   - `emitProgress(progress, type, message)` method
   - Optional per-request callback support
   - Event emitter pattern

2. **Create `sse-formatter.js`** (2h)
   - `formatOpenAIChunk(chunk)` → SSE string
   - `formatAnthropicEvent(event)` → SSE string
   - `formatProgressEvent(progress, type)` → SSE string
   - `write(res, data)` helper (adds `data: ` prefix + `\n\n`)

3. **Add streaming to `model-router.js`** (3h)
   - Modify `forward()` to detect `stream: true`
   - Pipe LM Studio response directly for streaming
   - Handle chunk buffering and forwarding
   - Properly handle stream errors

4. **Implement `/v1/chat/completions/stream`** (2h)
   - Validate `stream: true` in request
   - Set `Content-Type: text/event-stream`
   - Disable Express buffering
   - Wire up progress callbacks
   - Forward LM Studio stream with format conversion

### Day 2: Anthropic Streaming & Polish

5. **Implement `/v1/messages/stream`** (3h)
   - Anthropic-specific event formatting
   - Handle thinking/content block events
   - Same progress integration

6. **Integrate progress into `context-manager.js`** (2h)
   - Modify `enrich()` to accept optional progress callback
   - Add progress events at key milestones
   - Emit `context_enrich` progress

7. **Unit Tests** (2h)
   - Test `ProgressTracker` callbacks
   - Test `SSEFormatter` outputs
   - Test streaming route handlers (mock LM Studio)
   - Test error handling and cleanup

8. **Integration Tests** (1h)
   - End-to-end streaming flow
   - Verify SSE format
   - Test connection abort handling

## Testing Strategy

**Unit Tests (new file: `tests/test-streaming.js`):**
```javascript
describe('ProgressTracker', () => {
  test('emits progress events to callback');
  test('handles multiple listeners');
});

describe('SSEFormatter', () => {
  test('formats OpenAI chunk correctly');
  test('formats Anthropic message_start event');
  test('formats progress event');
});

describe('Streaming Routes', () => {
  test('POST /v1/chat/completions/stream returns SSE');
  test('POST /v1/messages/stream returns Anthropic events');
  test('handles LM Studio streaming response');
  test('propagates errors correctly');
  test('cleans up on client disconnect');
});
```

**Integration Tests:**
- Full streaming conversation with mock LM Studio
- Verify SSE format compliance
- Test progress events in stream
- Test connection abort recovery

## Acceptance Criteria

- ✅ `/v1/chat/completions/stream` returns valid OpenAI SSE format
- ✅ `/v1/messages/stream` returns valid Anthropic event stream
- ✅ Streaming chunks arrive in real-time (no buffering entire response)
- ✅ Progress events interleaved correctly with content
- ✅ Connection cleanup on client abort
- ✅ All unit tests pass (15+)
- ✅ Integration tests pass
- ✅ No memory leaks in long-running streams
- ✅ Documentation updated with examples

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LM Studio streaming format changes | Low | Medium | Test with current version, add adapter flexibility |
| Memory leaks with many concurrent streams | Medium | High | Ensure cleanup on `res.on('close')`, use WeakMap for tracking |
| Backpressure from slow clients | Medium | Medium | Set reasonable timeouts, max concurrent per client |
| Progress events break SSE format | Low | Medium | Strict validation in `sse-formatter.js` |

## Dependencies

- Phase 2 (Proxy Server) must be complete
- LM Studio must support streaming (chunked responses)
- Node.js streams API familiarity

## Success Metrics

- Streaming latency < 100ms from LM Studio chunk to client
- Zero memory leaks (verified with heap snapshots)
- 100+ concurrent streams without degradation
- All tests passing (unit + integration)

## Notes

- **Chunk Size:** LM Studio typically sends 1-5 token chunks. Forward as-is for responsiveness.
- **SSE Format:** Each event = `data: <json>\n\n`. No extra whitespace.
- **Keep-Alive:** Consider sending `:\n\n` comments every 15s to keep proxies happy.
- **Client Abort:** Always listen for `res.on('close')` to clean up LM Studio request.
- **Progress Events:** Send as `data: {"progress":50,"type":"..."}\n\n` - separate from content stream.

---

**Estimated Total Effort:** 16 hours
**Status:** Ready to implement after Phase 2 completion
